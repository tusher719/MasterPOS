<?php

// app/Services/Fraud/Layer1ValidationService.php

namespace App\Services\Fraud;

class Layer1ValidationService
{
    // Minimum word count required for a valid address
    private const ADDRESS_MIN_WORDS = 3;

    // Characters that suggest a name is just keyboard spam
    private const NAME_GIBBERISH_PATTERN = '/^[^a-zA-Z\x{0980}-\x{09FF}]+$/u';

    // Valid Bangladeshi mobile numbers: 01[3-9]XXXXXXXX (11 digits total)
    private const BD_PHONE_PATTERN = '/^(?:\+?88)?01[3-9]\d{8}$/';

    // Repeated character patterns that suggest gibberish (e.g. "aaaaaaa", "1111111")
    private const REPEATED_CHAR_PATTERN = '/^(.)\1{4,}$/u';

    // Address gibberish: all same char repeated or only punctuation/digits
    private const ADDRESS_GARBAGE_PATTERN = '/^[\d\s\W]+$/u';

    /**
     * Validate the phone number against the Bangladeshi mobile format.
     * Accepts: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
     *
     * Returns null on pass, error string on fail.
     */
    public function validatePhone(string $phone): ?string
    {
        $cleaned = preg_replace('/[\s\-()]/', '', $phone);

        if (!preg_match(self::BD_PHONE_PATTERN, $cleaned)) {
            return 'Phone number must be a valid Bangladeshi mobile number (e.g. 01712345678).';
        }

        return null;
    }

    /**
     * Validate the customer name.
     * Rejects: empty, purely numeric, purely special chars, repeated chars.
     *
     * Returns null on pass, error string on fail.
     */
    public function validateName(string $name): ?string
    {
        $trimmed = trim($name);

        if ($trimmed === '') {
            return 'Customer name is required.';
        }

        // Purely numeric names are not valid (e.g. "1234", "01712345678")
        if (is_numeric($trimmed)) {
            return 'Customer name cannot be a number.';
        }

        // No letters at all — only symbols/digits/punctuation
        if (preg_match(self::NAME_GIBBERISH_PATTERN, $trimmed)) {
            return 'Customer name must contain at least some letters.';
        }

        // Repeated single character (e.g. "aaaaa", "xxxxx")
        if (preg_match(self::REPEATED_CHAR_PATTERN, $trimmed)) {
            return 'Customer name appears to be invalid. Please enter a real name.';
        }

        // Too short to be a real name (less than 2 chars after trim)
        if (mb_strlen($trimmed) < 2) {
            return 'Customer name must be at least 2 characters.';
        }

        return null;
    }

    /**
     * Validate the delivery address.
     * Rejects: too few words, all digits/punctuation, repeated chars.
     *
     * Returns null on pass, error string on fail.
     */
    public function validateAddress(string $address): ?string
    {
        $trimmed = trim($address);

        if ($trimmed === '') {
            return 'Delivery address is required.';
        }

        // Count words (split on any whitespace)
        $words = preg_split('/\s+/', $trimmed, -1, PREG_SPLIT_NO_EMPTY);
        $wordCount = count($words);

        if ($wordCount < self::ADDRESS_MIN_WORDS) {
            return 'Delivery address is too short. Please enter a full address (at least 3 words).';
        }

        // Address is only digits, spaces, and punctuation — no actual location text
        if (preg_match(self::ADDRESS_GARBAGE_PATTERN, $trimmed)) {
            return 'Delivery address does not look valid. Please enter a real address.';
        }

        // All words are the same repeated character sequence
        $uniqueWords = array_unique(array_map('mb_strtolower', $words));
        if (count($uniqueWords) === 1 && mb_strlen(reset($uniqueWords)) < 3) {
            return 'Delivery address appears to be invalid. Please enter a real address.';
        }

        return null;
    }

    /**
     * Run all Layer 1 checks for a POS/storefront order.
     * Returns an array of field => error_message pairs.
     * Empty array means all checks passed.
     *
     * @param string      $phone   Customer phone (always required)
     * @param string|null $name    Customer name (required when not a registered customer)
     * @param string|null $address Delivery address (required when delivery_type is not store_pickup)
     */
    public function validate(string $phone, ?string $name = null, ?string $address = null): array
    {
        $errors = [];

        $phoneError = $this->validatePhone($phone);
        if ($phoneError) {
            $errors['phone'] = $phoneError;
        }

        if ($name !== null) {
            $nameError = $this->validateName($name);
            if ($nameError) {
                $errors['customer_name'] = $nameError;
            }
        }

        if ($address !== null) {
            $addressError = $this->validateAddress($address);
            if ($addressError) {
                $errors['delivery_address'] = $addressError;
            }
        }

        return $errors;
    }

    /**
     * Normalize a Bangladeshi phone number to the local 11-digit format.
     * Strips country code prefix if present.
     * Returns null if the number does not match the BD format.
     */
    public function normalizePhone(string $phone): ?string
    {
        $cleaned = preg_replace('/[\s\-()]/', '', $phone);

        if (!preg_match(self::BD_PHONE_PATTERN, $cleaned)) {
            return null;
        }

        // Strip +88 or 88 prefix to get the local 01XXXXXXXXX format
        if (str_starts_with($cleaned, '+88')) {
            return substr($cleaned, 3);
        }

        if (str_starts_with($cleaned, '88') && strlen($cleaned) === 13) {
            return substr($cleaned, 2);
        }

        return $cleaned;
    }
}
