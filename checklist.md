# API Integration Test Checklist

## Authentication
- [x ] `POST /api/auth/login` with **valid** credentials → returns `accessToken` & `refreshToken`
- [x ] `POST /api/auth/login` with **invalid** credentials → 401 Unauthorized
- [x ] `POST /api/auth/logout` with **valid** `refreshToken` → 200 OK & token removed
- [x ] `POST /api/auth/logout` with **invalid** `refreshToken` → still 200 OK (idempotent)

## Roles
- [ ] `POST /api/roles` → create role
- [ ] `GET  /api/roles` → list roles (with pagination & search)
- [ ] `GET  /api/roles/:id` → fetch single role
- [ ] `PATCH /api/roles/:id` → update role
- [ ] `DELETE /api/roles/:id` → delete role

## Permissions
- [ ] `POST /api/permissions` → create permission
- [ ] `GET  /api/permissions` → list permissions
- [ ] `GET  /api/permissions/:id` → fetch single permission
- [ ] `PATCH /api/permissions/:id` → update permission
- [ ] `DELETE /api/permissions/:id` → delete permission

## Role ⇄ Permissions
- [ ] `GET  /api/roles/:id/permissions` → list assigned perms
- [ ] `POST /api/roles/:id/permissions` → set perms array
- [ ] `DELETE /api/roles/:id/permissions/:permissionId` → remove one

## Users
- [ x] `POST /api/users` → create user (Zod validation)
- [ x] `GET  /api/users` → list users (pagination, filters)
- [ ] `GET  /api/users/basic` → list basic user info (pagination)
- [ ] `GET  /api/users/:id` → fetch single user
- [ ] `PATCH /api/users/:id` → update user (Zod validation)
- [ ] `DELETE /api/users/:id` → delete user

## Departments
- [ ] `POST /api/departments` → create dept
- [ ] `GET  /api/departments` → list depts
- [ ] `GET  /api/departments/:id` → fetch dept
- [ ] `PATCH /api/departments/:id` → update dept
- [ ] `DELETE /api/departments/:id` → delete dept

## Designations
- [ ] `POST /api/designations` → create desig
- [ ] `GET  /api/designations` → list desigs
- [ ] `GET  /api/designations/:id` → fetch desig
- [ ] `PATCH /api/designations/:id` → update desig
- [ ] `DELETE /api/designations/:id` → delete desig

## Visitors
- [ ] `POST /api/visitors` → create visitor
- [ ] `GET  /api/visitors` → list visitors (search, filters, pagination)
- [ ] `GET  /api/visitors/:id` → fetch visitor
- [ ] `PATCH /api/visitors/:id` → update visitor
- [ ] `DELETE /api/visitors/:id` → delete visitor

## Appointments
- [ ] `POST /api/appointments` → create appointment
- [ ] `GET  /api/appointments` → list appointments (filters & pagination)
- [ ] `GET  /api/appointments/:id` → fetch appointment
- [ ] `GET  /api/appointments/:id?includeDetails=true` → fetch with details
- [ ] `PATCH /api/appointments/:id` → update appointment
- [ ] `DELETE /api/appointments/:id` → delete appointment

## Appointment Details
- [ ] `POST   /api/appointments/:id/details` → add detail
- [ ] `GET    /api/appointments/:id/details` → list details
- [ ] `PATCH  /api/appointments/:id/details/:detailId` → update detail
- [ ] `DELETE /api/appointments/:id/details/:detailId` → delete detail

## Attendance Logs
- [ ] `POST /api/attendance-logs` → create log
- [ ] `GET  /api/attendance-logs` → list logs (filters & pagination)
- [ ] `GET  /api/attendance-logs/:id` → fetch log
- [ ] `PATCH /api/attendance-logs/:id` → update log
- [ ] `DELETE /api/attendance-logs/:id` → delete log

## Audit Logs
- [ ] `GET /api/audit-logs` → list audit entries (filters & pagination)
- [ ] `GET /api/audit-logs/:id` → fetch single audit entry

---

**Error Cases (for any protected route):**
- [ ] No `Authorization` header → 401 Unauthorized  
- [ ] Valid token but missing permission → 403 Forbidden  
- [ ] Invalid dynamic `:id` → 404 Not Found  

You can tick these off as you verify each endpoint!
