# User Creation & isStaff Field - API Documentation

## Overview
This document describes the new `isStaff` field and user creation capabilities across different role levels (Admin, Leaders, Super Leaders, General Secretary).

## Database Schema Changes

### User Model (`models/User.js`)
Added new field:
```javascript
isStaff: {
  type: Boolean,
  default: true
}
```

**Purpose**: Distinguishes between staff members and non-staff users.

## Migration
Run the migration to backfill existing users:
```bash
node hira_plus_backend/migration/add-isStaff.js
```
This sets `isStaff=true` for all existing users.

---

## User Creation by Role

### 1. Admin User Creation
**Endpoint**: `POST /api/admin/users`  
**Auth**: Admin authentication required

**isStaff Behavior**: Always `true` (forced, cannot be changed)

**Request Body**:
```json
{
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "department": "IT Department",
  "designation": "Software Engineer",
  "role": "member",
  "isDeptHead": false,
  "isFreeFood": false,
  "isIntern": false,
  "tags": ["tag_id_1", "tag_id_2"]
}
```

**Response**:
```json
{
  "message": "User added successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "phoneNumber": "9876543210",
    "department": { "_id": "dept_id", "title": "IT Department" },
    "designation": "Software Engineer",
    "isDeptHead": false,
    "status": "active",
    "isFreeFood": false,
    "isIntern": false,
    "isStaff": true,
    "role": { "_id": "role_id", "name": "member" },
    "tags": []
  }
}
```

---

### 2. Leader User Creation
**Endpoint**: `POST /api/leaders/users`  
**Auth**: Leader or Super Leader authentication required

**isStaff Behavior**: 
- **Leaders**: Always `false` (forced, cannot be changed)
- **Super Leaders**: Can be `true` or `false` (from request body; defaults to `false` if not provided)

**Request Body**:
```json
{
  "name": "Jane Smith",
  "phoneNumber": "9123456789",
  "department": "HR Department",
  "designation": "HR Manager",
  "role": "member",
  "isDeptHead": false,
  "isFreeFood": false,
  "isIntern": false,
  "isStaff": false,
  "tags": []
}
```

**Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "name": "Jane Smith",
    "phoneNumber": "9123456789",
    "department": { "_id": "dept_id", "title": "HR Department" },
    "designation": "HR Manager",
    "isDeptHead": false,
    "status": "active",
    "isFreeFood": false,
    "isIntern": false,
    "isStaff": false,
    "role": { "_id": "role_id", "name": "member" },
    "tags": []
  }
}
```

**Role Logic**:
- If requester is **leader**: `isStaff` is forced to `false`
- If requester is **super leader**: `isStaff` can be set from body (defaults to `false`)

---

### 3. General Secretary User Creation
**Endpoint**: `POST /api/general-secretary/users`  
**Auth**: General Secretary authentication required

**isStaff Behavior**: Can be `true` or `false` (from request body; defaults to `false` if not provided)

**Request Body**:
```json
{
  "name": "Alice Johnson",
  "phoneNumber": "9988776655",
  "department": "dept_id",
  "designation": "Team Leader",
  "role": "leader",
  "isDeptHead": false,
  "isFreeFood": false,
  "isIntern": false,
  "isStaff": true,
  "tags": []
}
```

**Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "name": "Alice Johnson",
    "phoneNumber": "9988776655",
    "department": { "_id": "dept_id", "title": "Department Name" },
    "designation": "Team Leader",
    "role": { "_id": "role_id", "name": "leader" },
    "isDeptHead": false,
    "isFreeFood": false,
    "isIntern": false,
    "isStaff": true,
    "status": "active",
    "isVerified": false,
    "tags": []
  }
}
```

**Notes**: 
- General Secretary can only create **leader** and **super leader** roles
- Other validation rules apply (phone uniqueness, department existence, etc.)

---

## isStaff Field Summary

| Creator Role | isStaff Value | Can be Changed? |
|--------------|---------------|-----------------|
| **Admin** | Always `true` | ❌ No (forced) |
| **Leader** | Always `false` | ❌ No (forced) |
| **Super Leader** | `true` or `false` | ✅ Yes (from body) |
| **General Secretary** | `true` or `false` | ✅ Yes (from body) |

**Default**: `false` when not provided (for Super Leader & General Secretary)

---

## Admin GET Endpoints - isStaff Exposure

The `isStaff` field is now included in all admin user-related responses:

### 1. Get All Users
**Endpoint**: `GET /api/admin/users`
- `isStaff` field included in each user object

### 2. Get Users List (Dropdown)
**Endpoint**: `GET /api/admin/users/list`
- `isStaff` field included in simplified user objects

### 3. Get Single User
**Endpoint**: `GET /api/admin/users/:userId`
- `isStaff` field included in user details

### 4. Update User
**Endpoint**: `PUT /api/admin/users/:userId`
- `isStaff` field included in response after update

---

## Validation Rules (All Endpoints)

### Phone Number
- Required
- Must be exactly 10 digits
- Automatically strips `+91` and non-digit characters
- Must be unique across all users

### Department
- Required
- Can be ObjectId or department title (string)
- Must exist in database

### Role
- Optional (defaults to `member` if not provided in Leaders API)
- Can be ObjectId or role name (string)
- Must exist in database
- **General Secretary**: Only `leader` and `super leader` roles allowed

### Tags
- Optional
- Must be array of valid tag ObjectIds
- All tag IDs must exist in database

### Name & Designation
- Required
- Cannot be empty after trimming

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide a valid 10-digit phone number"
}
```

### 400 Phone Already Exists
```json
{
  "success": false,
  "message": "User with this phone number already exists"
}
```

### 400 Invalid Department
```json
{
  "success": false,
  "message": "Invalid department. Please select a valid department."
}
```

### 400 Invalid Role
```json
{
  "success": false,
  "message": "Invalid role: driver"
}
```

### 400 Invalid Tags
```json
{
  "success": false,
  "message": "One or more tag IDs are invalid"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Only leaders and super leaders can perform this action."
}
```

---

## Testing

### Test Admin Create User
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phoneNumber": "9876543210",
    "department": "IT Department",
    "designation": "Developer",
    "role": "member"
  }'
```

### Test Leader Create User (isStaff forced to false)
```bash
curl -X POST http://localhost:3000/api/leaders/users \
  -H "Authorization: Bearer LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Non-Staff",
    "phoneNumber": "9123456789",
    "department": "HR Department",
    "designation": "Volunteer",
    "role": "member"
  }'
```

### Test Super Leader Create User (isStaff = true)
```bash
curl -X POST http://localhost:3000/api/leaders/users \
  -H "Authorization: Bearer SUPER_LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Staff",
    "phoneNumber": "9988776655",
    "department": "Finance",
    "designation": "Accountant",
    "role": "member",
    "isStaff": true
  }'
```

---

## Migration Script

Location: `hira_plus_backend/migration/add-isStaff.js`

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log('✅ Connected to MongoDB');
    
    console.log('🔄 Updating users with missing isStaff field...');
    const result = await User.updateMany(
      { isStaff: { $exists: false } },
      { $set: { isStaff: true } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users to set isStaff=true`);
    console.log(`📊 Total matched: ${result.matchedCount}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
})();
```

Run with:
```bash
node hira_plus_backend/migration/add-isStaff.js
```

---

## Change Log

### Version 1.0.0 - User Creation & isStaff Implementation

**Added**:
- `isStaff` boolean field to User model (default: `true`)
- POST `/api/leaders/users` endpoint for Leaders and Super Leaders
- `isStaff` validation logic based on creator role
- Migration script for existing users

**Modified**:
- Admin user creation forces `isStaff=true`
- General Secretary user creation accepts `isStaff` from body
- All admin GET endpoints now include `isStaff` field

**Validation**:
- Phone number uniqueness across all creation endpoints
- Department validation (ID or title)
- Role validation (ID or name)
- Tag validation (array of valid ObjectIds)

---

## Git Commits

```bash
git checkout -b feat/user-creation-isstaff
git add .
git commit -m "✨ feat(user): add isStaff boolean (default true) to user schema"
git commit -m "🧱 migration(user): backfill isStaff=true for existing users"
git commit -m "🔧 chore(admin): force isStaff=true on admin user creation; expose isStaff in responses"
git commit -m "✨ feat(leaders): add user creation; leaders force isStaff=false; super leaders can set isStaff"
git commit -m "✨ feat(gensec): allow isStaff true/false on user creation"
```

---

## Contact & Support

For issues or questions, please contact the development team.

