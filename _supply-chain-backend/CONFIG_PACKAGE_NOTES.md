# Config Package Notes

The `config` package contains classes that define how the Spring Boot application is wired at runtime. These files do not represent business features like shipment or risk prediction. Instead, they define the application's **framework-level behavior** such as security, CORS, and bean creation.

Relevant package:
`src/main/java/com/supplychain/config`

Files inside this package:
- `CorsConfig.java`
- `SecurityConfig.java`
- `JwtConfig.java`

## 1. What is a config package?

In Spring Boot, a config package usually contains classes annotated with `@Configuration`.

### What does configuration mean here?

Configuration means telling Spring:
- which objects should be created as beans
- how security should work
- which requests are allowed from the frontend
- what framework rules should apply globally

So the `config` package is the place where the application's infrastructure behavior is defined.

### Difference between service package and config package

- service package = business logic
- config package = application setup and framework rules

Example:
- service layer decides how shipment creation works
- config layer decides who can call the shipment API and from where

## 2. Common concept: `@Configuration`

Both `CorsConfig` and `SecurityConfig` use `@Configuration`.

References:
- `CorsConfig.java` line 11
- `SecurityConfig.java` line 20

### What does `@Configuration` do?

It tells Spring that the class contains bean definitions or application setup rules.

A class marked with `@Configuration` is processed by the Spring container during application startup.

That means Spring reads the class and registers the objects returned by `@Bean` methods.

## 3. `CorsConfig.java`

File:
`src/main/java/com/supplychain/config/CorsConfig.java`

Reference:
- `CorsConfig.java` lines 11 to 25

### Purpose

This class creates a global `CorsFilter` bean for the API.

### What is CORS?

CORS stands for **Cross-Origin Resource Sharing**.

A browser treats requests from different origins as restricted by default.

Example:
- frontend: `http://localhost:5173`
- backend: `http://localhost:8555`

Even though both are on localhost, the port is different, so they are treated as different origins.

Without CORS configuration, the browser may block frontend requests to the backend.

### `corsFilter()` bean
- `CorsConfig.java` lines 14 to 24

This method creates and returns a `CorsFilter` bean.

### What is a bean?

A bean is an object managed by the Spring container.

Once Spring registers this bean, it becomes part of the application's request-processing infrastructure.

### CORS settings explained

#### Allowed origins
- `CorsConfig.java` line 17

Allowed origin:
- `http://localhost:5173`

Meaning:
Only requests coming from that frontend origin are allowed by this CORS configuration.

#### Allowed methods
- `CorsConfig.java` line 18

Allowed HTTP methods:
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `OPTIONS`

Meaning:
The frontend can use these HTTP methods when calling the backend.

#### Allowed headers
- `CorsConfig.java` line 19

`*` means all headers are allowed.

This is important because JWT-based requests often include:
- `Authorization`
- `Content-Type`

#### Allow credentials
- `CorsConfig.java` line 20

`setAllowCredentials(true)` means credentials are allowed in cross-origin requests.

Conceptually, credentials can include:
- cookies
- authorization headers
- TLS client certificates

In this project, the important case is the authorization header.

#### URL pattern registration
- `CorsConfig.java` lines 22 to 23

The CORS configuration is registered for:
`/api/**`

Meaning:
It applies to all API endpoints under `/api`.

### Concept summary

`CorsConfig` makes sure the frontend running on `localhost:5173` can call this backend safely from the browser.

## 4. `SecurityConfig.java`

File:
`src/main/java/com/supplychain/config/SecurityConfig.java`

Reference:
- `SecurityConfig.java` lines 20 to 58

### Purpose

This class defines the Spring Security setup for the whole backend.

It controls:
- which routes are public or protected
- whether sessions are stateful or stateless
- where the JWT filter is placed
- what password encoder is used
- whether method-level role checks are enabled

This is the most important class in the config package.

## 5. Important annotations in `SecurityConfig`

### `@Configuration`
- `SecurityConfig.java` line 20

Marks the class as a configuration class.

### `@EnableMethodSecurity`
- `SecurityConfig.java` line 21

This enables method-level authorization annotations like:
- `@PreAuthorize("hasRole('ADMIN')")`

### Why this matters

Some controllers in this project use admin-only rules. Those rules only work because method security is enabled here.

So this class does not only protect URLs globally, it also enables deeper authorization checks at method level.

### `@RequiredArgsConstructor`
- `SecurityConfig.java` line 22

This allows constructor injection for the final field:
- `JwtAuthFilter`

Reference:
- `SecurityConfig.java` line 25

## 6. `filterChain()` in `SecurityConfig`

Reference:
- `SecurityConfig.java` lines 27 to 48

### What is `SecurityFilterChain`?

Spring Security processes requests through a chain of filters.
Each filter has a specific job such as:
- checking headers
- authenticating users
- applying authorization rules
- handling exceptions

`SecurityFilterChain` defines how that chain should behave.

### Step-by-step explanation of the configuration

#### CORS inside Spring Security
- `SecurityConfig.java` lines 32 to 39

This class configures CORS again directly inside the security chain.

### Why is CORS configured here too?

Because Spring Security can intercept requests before they reach normal MVC filters.
If CORS is not allowed in the security chain, preflight `OPTIONS` requests may fail before controller logic runs.

So this is security-aware CORS handling.

The configuration here allows:
- origin `http://localhost:5173`
- methods `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- all headers
- credentials

This matches the values in `CorsConfig`.

#### CSRF disabled
- `SecurityConfig.java` line 40

### What is CSRF?

CSRF stands for **Cross-Site Request Forgery**.
It is mainly a concern in cookie/session-based authentication.

### Why is it disabled here?

This project uses JWT-based stateless authentication instead of server-side sessions.
For that kind of REST API, disabling CSRF is common.

#### Stateless session management
- `SecurityConfig.java` line 41

This sets:
`SessionCreationPolicy.STATELESS`

### Meaning

The backend will not maintain login session state on the server.
Every request must carry its own authentication token.

This matches the JWT design used in the project.

#### Authorization rules
- `SecurityConfig.java` lines 42 to 45

Rules defined here:
- `/api/auth/**` is public
- all other requests require authentication

### Meaning

Public routes:
- register
- login

Protected routes:
- shipments
- dashboard
- alerts
- disruptions
- risk endpoints

unless additional method-level rules apply.

#### Custom JWT filter placement
- `SecurityConfig.java` line 46

The code adds `jwtAuthFilter` before `UsernamePasswordAuthenticationFilter`.

### Why does filter order matter?

Spring Security processes filters in order.
The JWT filter must run early so that the user is authenticated before authorization checks happen.

If the token is valid, the filter places authentication into the `SecurityContextHolder`, and then the rest of Spring Security sees the user as logged in.

## 7. `passwordEncoder()` bean

Reference:
- `SecurityConfig.java` lines 50 to 53

This method returns:
`new BCryptPasswordEncoder()`

### Concept: password hashing

Passwords should never be stored as plain text.
Instead, they should be converted into hashed form.

`BCryptPasswordEncoder` is a standard and secure choice in Spring applications.

### Why BCrypt is good

- it hashes passwords securely
- it is intentionally slow, making brute-force attacks harder
- it includes salting internally

This bean is used by the authentication service when users register or log in.

## 8. `authenticationManager()` bean

Reference:
- `SecurityConfig.java` lines 55 to 57

This method exposes the Spring `AuthenticationManager` as a bean.

### What is `AuthenticationManager`?

It is a Spring Security component responsible for performing authentication.

In more traditional Spring Security flows, it verifies credentials using configured authentication providers.

### In this project

The current code handles login manually inside `AuthServiceImpl`, but this bean is still useful because:
- it keeps the application ready for future standard authentication flows
- it centralizes access to Spring's authentication system if needed later

## 9. `JwtConfig.java`

File:
`src/main/java/com/supplychain/config/JwtConfig.java`

Reference:
- `JwtConfig.java` lines 1 to 4

### What it currently contains

This class is currently empty.

### What does that mean?

It means the file exists but is not contributing any runtime behavior right now.
There are no annotations, no fields, no methods, and no beans in it.

### Why might such a file exist?

A class like `JwtConfig` is often intended for future use, such as:
- reading JWT properties into a typed object
- centralizing token-related beans
- separating JWT configuration from general security setup

### Current project design

In this project, JWT settings are injected directly into `JwtUtil` using `@Value`, so `JwtConfig` is not needed at the moment.

## 10. Relationship between config package and other packages

The config package supports other layers of the project.

### With controller package
Controllers do not directly configure security or CORS. They simply define endpoints.
The config package decides whether those endpoints are publicly accessible or protected.

### With security package
The config package wires the security classes into Spring.
For example:
- `SecurityConfig` injects `JwtAuthFilter`
- the filter becomes part of the request pipeline

### With service package
Services do not manage password encoding, route protection, or stateless authentication directly.
Those concerns are configured centrally here.

## 11. Key architectural concepts visible in the config package

### Centralized framework setup
Instead of scattering security and CORS rules throughout the application, this package keeps them in one place.

### Inversion of control
Spring creates and manages the configured beans rather than the application manually constructing them everywhere.

### Bean-driven architecture
Methods annotated with `@Bean` contribute managed objects to the application context.

### Cross-cutting concerns
CORS and security affect many parts of the app at once.
They are called cross-cutting concerns because they apply across multiple features.
The config package is the correct place for these concerns.

## 12. Important observation about this codebase

Both `CorsConfig` and `SecurityConfig` define CORS behavior.

References:
- `CorsConfig.java` lines 14 to 24
- `SecurityConfig.java` lines 32 to 39

### Conceptual meaning

This indicates the developer wanted CORS to work both at the MVC/filter level and inside Spring Security.
That is understandable because security can block preflight requests if CORS is not configured there.

### Practical note

In many Spring Security applications, configuring CORS in the security chain is usually the most important part. A separate `CorsFilter` may be redundant if the security configuration already handles the same rules.

That is an architectural observation, not necessarily a bug, but it is useful to understand while studying the package.

## 13. Simple runtime picture

When the app starts:
1. Spring scans the config package.
2. `CorsConfig` creates a `CorsFilter` bean.
3. `SecurityConfig` creates a `SecurityFilterChain` bean.
4. `SecurityConfig` also creates `PasswordEncoder` and `AuthenticationManager` beans.
5. Spring uses these beans to control request handling and authentication behavior.

When a frontend request comes in:
1. CORS rules are checked.
2. Spring Security processes the request.
3. Public endpoints are allowed without login.
4. Protected endpoints require JWT authentication.
5. Method-level checks like admin-only access are applied if present.

## 14. Short summary

The `config` package defines the application's infrastructure rules. `CorsConfig` allows the frontend origin to access backend APIs through browser CORS rules. `SecurityConfig` sets up Spring Security, stateless JWT-based protection, public and protected routes, password encoding, and authentication-related beans. `JwtConfig` currently exists as an empty placeholder and does not affect runtime behavior. Overall, the config package is responsible for how the framework behaves around the business logic, not for implementing the business logic itself.
