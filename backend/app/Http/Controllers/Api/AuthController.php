<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    /** Used so an unknown phone costs the same time as a wrong password. */
    private static ?string $dummyHash = null;

    public function login(LoginRequest $request)
    {
        // Per phone + IP, on top of the route's throttle:5,1 (which is per IP only)
        $key = 'login:'.$request->phone.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()
                ->json(['message' => 'Trop de tentatives. Réessayez dans une minute.'], 429)
                ->header('Retry-After', (string) RateLimiter::availableIn($key));
        }

        $admin = Admin::where('phone', $request->phone)->first();

        // Always run one hash check, whether the account exists or not
        self::$dummyHash ??= Hash::make('bamed-dummy-password');
        $passwordOk = Hash::check($request->password, $admin?->password ?? self::$dummyHash);

        if (! $admin || ! $passwordOk) {
            RateLimiter::hit($key, 60);

            return response()->json(['message' => 'Téléphone ou mot de passe incorrect.'], 401);
        }

        if (! $admin->active) {
            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        RateLimiter::clear($key);

        return response()->json([
            'accessToken' => $admin->createToken('admin')->plainTextToken,
            'user' => new UserResource($admin),
        ]);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }
}