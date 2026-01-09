# Troubleshooting Guide

## Common Issues and Solutions

### 1. Registration/Login Not Working

#### Check MongoDB Connection
1. Verify MongoDB is running:
   ```bash
   # Check if MongoDB is running
   mongosh
   # Or check service status
   ```

2. Check `.env.local` file exists with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/racing-game
   JWT_SECRET=your-secret-key
   ADMIN_EMAIL=admin@racinggame.com
   ```

3. Test API connection:
   - Open browser console
   - Go to: `http://localhost:3000/api/test`
   - Should return: `{"status":"success","message":"API is working and MongoDB is connected"}`

#### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to register/login
4. Look for error messages
5. Check Network tab for failed requests

#### Common Errors:

**"Database connection failed"**
- MongoDB is not running
- Wrong MONGODB_URI in `.env.local`
- MongoDB service not started

**"User already exists"**
- Email is already registered
- Try a different email

**"Validation failed"**
- Check all fields are filled correctly
- Date of birth must be 18+ years old
- Password must be at least 6 characters
- Verification question must be selected

**"Invalid email or password"**
- Check email is correct
- Check password is correct
- Check verification answer matches what you set during registration

### 2. Form Not Submitting

#### Check Form Validation
- All required fields must be filled
- Email must be valid format
- Password must match confirmation
- Date of birth must be valid and 18+

#### Check Network Requests
1. Open DevTools → Network tab
2. Try to submit form
3. Look for POST requests to `/api/auth/register` or `/api/auth/login`
4. Check response status and body

### 3. Verification Question Not Showing (Login)

- Make sure you enter a valid email first
- Wait 500ms after typing email
- Check browser console for errors
- Verify user exists in database

### 4. Token Not Stored

- Check browser localStorage:
  1. Open DevTools → Application tab
  2. Go to Local Storage
  3. Should see `token` and `user` keys after successful login/register

### 5. Redirect Not Working

- Check if token exists in localStorage
- Check browser console for errors
- Verify `/play` route exists

## Debug Steps

1. **Check Server Logs**
   - Look at terminal where `npm run dev` is running
   - Check for error messages

2. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Network tab for failed requests

3. **Test API Directly**
   ```bash
   # Test registration
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123","dob":"2000-01-01","verificationQuestion":"What is your favorite color?","verificationAnswer":"blue"}'
   ```

4. **Verify MongoDB**
   ```bash
   mongosh
   use racing-game
   db.users.find().pretty()
   ```

## Still Having Issues?

1. Clear browser cache and localStorage
2. Restart the dev server
3. Check MongoDB is running
4. Verify all environment variables are set
5. Check server logs for detailed error messages

