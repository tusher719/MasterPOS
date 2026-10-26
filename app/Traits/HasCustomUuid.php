<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasCustomUuid
{
    /**
     * Boot the trait to automatically assign a UUID when creating a new model.
     */
    protected static function bootHasCustomUuid(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Scope a query to search by UUID.
     */
    public function scopeWhereUuid($query, string $uuid)
    {
        return $query->where('uuid', $uuid);
    }

    /**
     * Resolve route binding by UUID if the value is a valid UUID format,
     * otherwise fallback to default route key (usually ID).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field === null && Str::isUuid($value)) {
            return $this->where('uuid', $value)->first();
        }

        return parent::resolveRouteBinding($value, $field);
    }
}
