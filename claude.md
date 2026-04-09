# Markd at Work

Factory order management system for a clothing brand.

## Architecture

- Flutter apps: iOS, Android, macOS (order creation/tracking)
- Flutter app: Windows (order receiving, processing, status updates)
- Supabase: Postgres database, realtime subscriptions, auth

## Repo Structure

apps/mobile       -- Flutter app for iOS and Android
apps/desktop-mac  -- Flutter app for macOS
apps/desktop-win  -- Flutter app for Windows
supabase/         -- DB migrations and schema
packages/shared/  -- Shared Dart constants and enums

## Auth

Shared device accounts. No per-user login.
Two roles: MANAGEMENT (mobile + mac) and FACTORY (windows).

## Core Data Models

Order: id, customer_name, deadline, status, notes, created_at
OrderItem: id, order_id, piece_type, quantity
Customisation: id, order_item_id, key, value
Measurement: id, order_item_id, key, value

Status enum: PENDING, IN_PROGRESS, DONE, FLAGGED

## Key Behaviours

- Management side creates orders with items, customisations, measurements
- Factory Windows app receives orders in real-time via Supabase Realtime
- Factory side updates order status; updates push back to management in real-time
- Orders queue on Windows sorted by deadline and priority
- All instructions (customisations + measurements) are per OrderItem

## Conventions

- Use Riverpod for Flutter state management
- Use Supabase Flutter SDK for DB and realtime
- Use snake_case for DB columns, camelCase in Dart code
- Every DB table has created_at and updated_at timestamps
- Never hardcode credentials -- use .env or flutter_dotenv

## Current Task

Scaffold the project. Start with:
1. Supabase migration files for the core schema
2. Flutter app skeleton for apps/mobile with Supabase connected