# Security Package Notes

The `security` package in this project is responsible for **authentication and authorization** using **Spring Security** and **JWT (JSON Web Token)**.

Relevant package:
`src/main/java/com/supplychain/security`

Related supporting files:
- `src/main/java/com/supplychain/config/SecurityConfig.java`
- `src/main/java/com/supplychain/config/JwtConfig.java`
- `src/main/resources/application.properties`

## 1. What is the purpose of the security package?

In a backend application, the security layer answers questions like:
- Who is the user?
- Is the user logged in?
- Is the token valid?
- What role does the user have?
- Can this user access this API?

So the `security` package protects the backend from unauthorized access.

In this project, the security flow is:

`Login/Register -> JWT token generated -> client sends token in Authorization header -> filter validates token -> Spring Security stores authenticated user -> protected APIs become accessible`

## 2. Main security concept used here: JWT authentication

JWT means **JSON Web Token**.

A JWT is a signed token that contains user information such as:
- subject or user identity
- role
- issue time
- expiration time

This project uses JWT so that the backend remains **stateless**.

### What does stateless mean?

Stateless means the server does not keep login session data in memory for each user.
Instead:
- the server gives a token after login
- the client stores that token
- the client sends that token with every request
- the server validates it on each request

This is why `SessionCreationPolicy.STATELESS` is used in `SecurityConfig`.

Reference:
- `SecurityConfig.java` line 41

## 3. Files inside the security package

The security package contains these files:
- `JwtAuthFilter.java`
- `JwtUtil.java`
- `UserDetailsServiceImpl.java`

Each file has a different responsibility.

## 4. `JwtAuthFilter.java`

File:
`src/main/java/com/supplychain/security/JwtAuthFilter.java`

### Purpose

This class checks every incoming HTTP request and looks for a JWT token in the `Authorization` header.

Reference:
- `JwtAuthFilter.java` lines 21 to 49

### Class concept

This class extends `OncePerRequestFilter`.

### What is `OncePerRequestFilter`?

It is a Spring Security filter that runs **once for every request**.
That makes it suitable for authentication logic because every request must be checked exactly once.

Reference:
- `JwtAuthFilter.java` line 21

### Key dependencies

- `JwtUtil` for token validation and claim extraction
- `UserDetailsServiceImpl` for loading user details from the database

Reference:
- `JwtAuthFilter.java` lines 23 and 24

### How it works step by step

#### Step 1: Read Authorization header
- `JwtAuthFilter.java` line 30

The filter reads:
`Authorization: Bearer <token>`

#### Step 2: Check header format
- `JwtAuthFilter.java` lines 32 to 35

If the header is missing or does not start with `Bearer `, the filter does nothing and passes the request forward.

Concept:
This prevents unnecessary authentication failures for public endpoints such as login and register.

#### Step 3: Extract token
- `JwtAuthFilter.java` line 37

The code removes the `Bearer ` prefix and gets the raw token.

#### Step 4: Validate token
- `JwtAuthFilter.java` line 38

The token is sent to `JwtUtil.validateToken(token)`.

Concept:
Validation checks:
- signature correctness
- token structure
- expiration
- parsing validity

#### Step 5: Extract email
- `JwtAuthFilter.java` line 39

After validation, the email is extracted from the token subject.

#### Step 6: Load user details
- `JwtAuthFilter.java` line 40

The filter calls `userDetailsService.loadUserByUsername(email)`.

Concept:
Even though the JWT contains user info, Spring Security still needs a `UserDetails` object with authorities for authorization decisions.

#### Step 7: Build authentication object
- `JwtAuthFilter.java` lines 42 to 45

A `UsernamePasswordAuthenticationToken` object is created and stored in the `SecurityContextHolder`.

### Why is this important?

`SecurityContextHolder` is where Spring Security stores the current authenticated user for the current request.
Once authentication is placed there, the rest of the application treats the request as logged in.

### Final step
- `JwtAuthFilter.java` line 48

The filter passes control to the next filter in the chain.

### Concept summary

`JwtAuthFilter` acts like a gatekeeper.
It intercepts requests, verifies tokens, and tells Spring Security who the user is.

## 5. `JwtUtil.java`

File:
`src/main/java/com/supplychain/security/JwtUtil.java`

### Purpose

This class is the helper utility for creating, parsing, and validating JWT tokens.

Reference:
- `JwtUtil.java` lines 14 to 62

### Configuration values used

- `jwt.secret`
- `jwt.expiration-ms`

Reference:
- `JwtUtil.java` lines 16 to 20
- `application.properties` lines 18 to 21

### Important concept: signing key

`JwtUtil` creates a signing key from the secret string.

Reference:
- `JwtUtil.java` lines 22 to 24

Why this matters:
- the token is digitally signed
- if someone changes token contents, the signature becomes invalid
- the server can detect tampering

### `generateToken()`
- `JwtUtil.java` lines 26 to 34

This method creates a token using:
- subject = email
- claim `role` = user role
- issued time
- expiration time
- HS256 signature algorithm

### Important JWT concepts here

#### Subject
The main identity of the token holder.
Here it is the user email.

#### Claims
Claims are extra pieces of information stored in a JWT.
Here the custom claim is:
- `role`

#### Expiration
The token is valid only until a fixed time.
This improves security by limiting token lifetime.

#### Signature Algorithm
HS256 is an HMAC-based signing algorithm.
It uses the secret key to sign and verify the token.

### `extractEmail()`
- `JwtUtil.java` lines 36 to 38

This reads the token subject.
In this project, subject means user email.

### `extractRole()`
- `JwtUtil.java` lines 40 to 42

This reads the custom `role` claim.

### `validateToken()`
- `JwtUtil.java` lines 44 to 52

This method tries to parse the token.
If parsing succeeds, the token is considered valid.
If parsing fails, it returns `false`.

Concept:
This is defensive token verification. Invalid or expired tokens should not authenticate the user.

### `getClaims()`
- `JwtUtil.java` lines 54 to 60

This is the internal parsing method used by the other methods.
It reads the token and returns claims.

### Concept summary

`JwtUtil` is the token toolbox of the application.
It is responsible for:
- issuing tokens
- extracting identity information
- checking validity

## 6. `UserDetailsServiceImpl.java`

File:
`src/main/java/com/supplychain/security/UserDetailsServiceImpl.java`

### Purpose

This class connects the application's `User` entity with Spring Security's `UserDetails` model.

Reference:
- `UserDetailsServiceImpl.java` lines 12 to 27

### Core concept: `UserDetailsService`

Spring Security uses the `UserDetailsService` interface to load user information during authentication.

This project implements that interface in `UserDetailsServiceImpl`.

Reference:
- `UserDetailsServiceImpl.java` line 14

### `loadUserByUsername()`
- `UserDetailsServiceImpl.java` lines 19 to 26

This method:
- takes email as input
- finds the user from `UserRepository`
- throws `UsernameNotFoundException` if not found
- returns Spring Security `UserDetails`

### Why email is used as username

Spring Security uses the method name `loadUserByUsername`, but the application can decide what the username actually is.
In this project, the username is the user's email.

### Authority mapping
- `UserDetailsServiceImpl.java` line 25

This creates:
`ROLE_` + `user.getRole().name()`

Example:
- if role is `ADMIN`, authority becomes `ROLE_ADMIN`
- if role is `USER`, authority becomes `ROLE_USER`

### Why `ROLE_` matters

Spring Security expects role-based authorization to use the `ROLE_` prefix when methods like `hasRole('ADMIN')` are used.

That directly supports code like:
- `@PreAuthorize("hasRole('ADMIN')")`

used in protected controllers.

### Concept summary

`UserDetailsServiceImpl` translates database users into a Spring Security-compatible format.
Without this adapter, Spring Security would not know how to interpret your `User` entity.

## 7. Supporting file: `SecurityConfig.java`

File:
`src/main/java/com/supplychain/config/SecurityConfig.java`

Although it is in the `config` package, it is essential to understand the security package because it wires the security components together.

Reference:
- `SecurityConfig.java` lines 20 to 58

### Purpose

This class defines the Spring Security setup for the application.

### `@EnableMethodSecurity`
- `SecurityConfig.java` line 21

Concept:
This enables annotations such as:
- `@PreAuthorize("hasRole('ADMIN')")`

That means security can be applied directly at method or controller level.

### `SecurityFilterChain`
- `SecurityConfig.java` lines 27 to 48

This is the modern Spring Security way to configure HTTP security.

### Main settings explained

#### CORS configuration
- `SecurityConfig.java` lines 32 to 39

Allows requests from:
- `http://localhost:5173`

Concept:
Frontend and backend often run on different ports during development. CORS tells the browser which origins are allowed.

#### CSRF disabled
- `SecurityConfig.java` line 40

Concept:
CSRF is mainly relevant for session-based browser authentication.
For stateless JWT APIs, disabling CSRF is common.

#### Stateless sessions
- `SecurityConfig.java` line 41

This means no server-side login session is stored.
Authentication depends entirely on the JWT sent with each request.

#### Route authorization
- `SecurityConfig.java` lines 42 to 45

Rules:
- `/api/auth/**` is public
- all other routes require authentication

This is why register and login work without token, but shipment or dashboard APIs require token.

#### Filter registration
- `SecurityConfig.java` line 46

The custom JWT filter is added before Spring's `UsernamePasswordAuthenticationFilter`.

Concept:
That order matters because JWT authentication should happen early in the filter chain before Spring checks access rules.

### Password encoder bean
- `SecurityConfig.java` lines 50 to 53

Uses `BCryptPasswordEncoder`.

Concept:
Passwords should never be stored as plain text.
BCrypt hashes passwords safely so even if the database leaks, raw passwords are not exposed directly.

### AuthenticationManager bean
- `SecurityConfig.java` lines 55 to 57

This exposes Spring's `AuthenticationManager` as a bean.
In the current codebase, authentication is handled manually in the auth service, but this bean keeps the configuration ready for future standard authentication flows.

## 8. Supporting file: `JwtConfig.java`

File:
`src/main/java/com/supplychain/config/JwtConfig.java`

Reference:
- `JwtConfig.java` lines 1 to 4

### What it currently does

This file is currently empty.

### Conceptually, what might it be used for?

A class like `JwtConfig` is usually used for:
- binding JWT properties from configuration
- centralizing JWT-related beans
- separating JWT setup from general security setup

In this project, JWT properties are injected directly into `JwtUtil`, so `JwtConfig` is currently unused.

## 9. JWT properties from `application.properties`

File:
`src/main/resources/application.properties`

Relevant lines:
- `application.properties` lines 18 to 21

### `jwt.secret`
This is the secret key used to sign JWT tokens.

### `jwt.expiration-ms`
This defines token lifetime in milliseconds.

Current value:
- `86400000`
- which equals 24 hours

### Important security concept

The secret key must be strong and private.
If an attacker gets the secret, they may be able to forge valid tokens.

In real production systems, secrets should not be stored directly in plain application properties committed to source control. They are usually stored in:
- environment variables
- secret managers
- secured deployment configuration

## 10. Full authentication flow in this project

### Registration flow
1. User sends register request.
2. `AuthServiceImpl` checks whether email already exists.
3. Password is hashed with `PasswordEncoder`.
4. User is saved in database.
5. `JwtUtil.generateToken()` creates a JWT.
6. Token is returned to the client.

### Login flow
1. User sends email and password.
2. `AuthServiceImpl` finds user by email.
3. Password hash is verified.
4. `JwtUtil.generateToken()` creates token.
5. Token is returned.

### Protected request flow
1. Client sends `Authorization: Bearer <token>`.
2. `JwtAuthFilter` reads the header.
3. `JwtUtil` validates the token.
4. Email is extracted from token.
5. `UserDetailsServiceImpl` loads user details and authorities.
6. Authentication is stored in `SecurityContextHolder`.
7. Spring Security allows the request if authorization rules pass.

## 11. Authorization concept in this project

Authentication means:
- proving who the user is

Authorization means:
- deciding what the authenticated user can do

This project uses role-based authorization.

Example:
Some APIs use:
`@PreAuthorize("hasRole('ADMIN')")`

That means only users with `ROLE_ADMIN` authority can access them.

This works because:
- the user role is stored in database
- `UserDetailsServiceImpl` maps it to `ROLE_ADMIN` or `ROLE_USER`
- Spring Security checks that authority during request processing

## 12. Why this security design is good

### Strengths
- clean separation of JWT utility, filter, and user-loading logic
- stateless authentication fits REST APIs well
- role-based security is supported
- BCrypt is used for password hashing
- method-level security is enabled
- custom JWT filter is integrated properly into Spring Security chain

### Architectural clarity
Each class has one clear job:
- `JwtUtil` handles token operations
- `JwtAuthFilter` handles request authentication
- `UserDetailsServiceImpl` loads users and roles
- `SecurityConfig` wires the rules together

This is good design because responsibilities are not mixed.

## 13. Important interview or exam points

- `JwtAuthFilter` extends `OncePerRequestFilter` so JWT checking happens once per request.
- `SecurityContextHolder` stores authentication information for the current request.
- `UserDetailsServiceImpl` adapts database users to Spring Security's `UserDetails` format.
- `ROLE_` prefix is important for Spring Security role checks.
- `SessionCreationPolicy.STATELESS` means the backend does not store login sessions.
- `BCryptPasswordEncoder` securely hashes passwords.
- `JwtUtil` creates and validates tokens using secret key and expiration settings.

## 14. Short summary

The `security` package implements JWT-based authentication in the project. `JwtUtil` creates and validates tokens, `JwtAuthFilter` intercepts requests and authenticates users from bearer tokens, and `UserDetailsServiceImpl` loads user data and roles from the database in Spring Security format. These classes work together with `SecurityConfig`, which defines route protection, stateless session behavior, password encoding, and filter-chain registration. Together, they provide secure access control for the backend APIs.
