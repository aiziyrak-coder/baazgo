# Security Specification - FoodTruckGo Uzbekistan

## Data Invariants
1. A **User** profile must be created with the matching authenticated UID. Roles are system-assigned (default 'user').
2. A **FoodTruck** can only be created/updated by an Admin or its specific Owner.
3. A **Booking** must have a valid `truckId` and `userId`.
4. Users can only read/list their own **Bookings**.
5. Financial fields like `pricePerDay` in `FoodTruck` and `totalPrice` in `Booking` must be immutable or restricted to admins.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **Role Escalation**: Attempt to set `role: 'admin'` during self-registration.
3. **Price Manipulation**: Attempt to update a truck's `pricePerDay` to 0.
4. **Foreign Booking**: Attempt to create a booking for another user's UID.
5. **Inventory Poisoning**: Inject a 2MB string into a truck's `description`.
6. **ID Injection**: Use a malformed document ID (e.g. `../etc/passwd`) to bypass path logic.
7. **Phantom Truck**: Create a booking for a `truckId` that does not exist.
8. **Double Booking**: (Server-side logic usually handles this, rules can enforce base constraints).
9. **Email Spoofing**: Use an unverified email to claim admin status.
10. **State Skipping**: Move a booking directly from `pending` to `completed` without `paymentStatus: 'paid'`.
11. **List Scraping**: Attempt to list all users as a regular user.
12. **Metadata Hijacking**: Overwrite the `createdAt` timestamp with a past date.

## Implementation Details
- Standard reusable helpers: `isSignedIn()`, `isOwner(userId)`, `isAdmin()`.
- Entity validators: `isValidUser()`, `isValidFoodTruck()`, `isValidBooking()`.
