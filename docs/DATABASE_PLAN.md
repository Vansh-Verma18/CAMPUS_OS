# Database Plan

*Note: The actual schemas are implemented using Pydantic in the `backend/app/schemas` directory. This document reflects the structural design of the CampusOS database layer.*

## MongoDB Collections (Structured Data)

MongoDB is the authoritative source for structured institutional records. We use **referencing** (storing ObjectIds) instead of embedding for major relationships to maintain document size limits and ensure modular updates.

1. **Users**
   - **Purpose:** Authentication identity and role information.
   - **Important Fields:** `email` (unique index), `password_hash` (never exposed in API responses), `role` (Admin/Student/Faculty), `account_status`.
   - **Relationships:** Referenced by Students, Faculty, Registrations, Attendance, Expenses, Feedback.

2. **Students & Faculty**
   - **Purpose:** Profile data separated from the core auth entity.
   - **Important Fields:** `user_id`, `department_id`, `enrollment_year` (Student), `designation` (Faculty).

3. **Departments**
   - **Purpose:** Institutional departments.
   - **Important Fields:** `name`, `code`, `head_faculty_id`.
   - **Relationships:** Referenced by Students, Faculty, Clubs, Events.

4. **Clubs**
   - **Purpose:** Student organizations.
   - **Important Fields:** `name`, `coordinator_id`, `department_id`.
   - **Relationships:** Referenced by Events as organizers.

5. **Events**
   - **Purpose:** Campus events and activities.
   - **Important Fields:** `start_datetime`, `end_datetime`, `expected_participants`, `venue_id`, `organizer_club_id`.
   - **Validation:** Pydantic validation ensures `end_datetime` is not earlier than `start_datetime`.
   - **Indexes:** Indexed on `start_datetime`, `venue_id`, and `organizer_club_id` for quick queries and future conflict detection.

6. **Venues & Resources**
   - **Purpose:** Physical locations and shared equipment.
   - **Validation:** `capacity` (Venue) and `quantity` (Resource) must be non-negative.

7. **Registrations & Attendance**
   - **Purpose:** Tracking intent to attend (Registrations) and actual check-ins (Attendance).
   - **Validation/Indexes:** A unique composite index on `{event_id, user_id}` prevents accidental duplicate registrations/attendance records per event.

8. **Expenses**
   - **Purpose:** Event costs.
   - **Important Fields:** `amount` (validated to be `>= 0`), `recorded_by`, `status`.
   - **Security:** Sensitive financial data, restricted to authorized roles in the future.

9. **Feedback**
   - **Purpose:** Post-event feedback.
   - **Important Fields:** `rating` (1-5), `comments`, `event_id`.

10. **Documents**
    - **Purpose:** Metadata for institutional documents.
    - **Important Fields:** `access_classification` (indexed), `storage_path`, `processing_status`.
    - **Design Note:** The entire extracted text is NOT stored in MongoDB. The vectorized representation will be handled by ChromaDB.

## ChromaDB Collections (Vector Data)

1. **Institutional_Knowledge**
   - Vector embeddings of institutional documents chunked for RAG.
   - Includes metadata linking back to the MongoDB `Documents` collection.
