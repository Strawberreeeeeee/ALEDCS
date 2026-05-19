# ALEDCS Security Specification

## Data Invariants
1. A history entry must belong to the authenticated user attempting to write it.
2. User profiles can only be created with the UID matching the authenticated requester.
3. Users can only read their own history.
4. `createdAt` must be set to the server time during creation and remain immutable.

## The Dirty Dozen Payloads

1. **Identity Spoofing (User Profile)**: Attempt to create a user profile with a UID that doesn't match the requester's `auth.uid`.
2. **Identity Spoofing (History)**: Attempt to write a history entry to another user's subcollection.
3. **Email Spoofing**: Attempt to use an unverified email for privileged operations (if applicable).
4. **State Poisoning**: Inject a huge string (1MB+) into the `code` field of a history entry.
5. **Timestamp Manipulation**: Set `createdAt` to a past or future date instead of `serverTimestamp()`.
6. **Immutability Breach**: Attempt to update an existing user document to change the `userId`.
7. **Junk ID Poisoning**: Create a history entry with an ID containing illegal characters (e.g. `../etc/passwd`).
8. **PII Leak**: Authenticated user 'A' attempts to list or get the profile of user 'B'.
9. **Shadow Update**: Attempt to update a history entry with an extra 'isVerified: true' field not in the schema.
10. **Query Scrapping**: Attempt a blanket list query on `/users` without a filter on the owner ID.
11. **Type Poisoning**: Send an integer for the `displayName` field.
12. **Orphaned Write**: Attempt to write a history entry without a corresponding user profile (if required by rules).

## Rules Evaluation (Anticipated)
The rules will use `isValidId()`, `isValidUser()`, and `isValidHistoryEntry()` helpers to enforce these invariants.
