# Service Package Notes

The `service` package is the **business logic layer** of this Spring Boot application. It sits between the controller layer and the repository or external-client layer.

Relevant package:
`src/main/java/com/supplychain/service`

Files inside this package:
- `AlertService.java`
- `AlertServiceImpl.java`
- `AuthService.java`
- `AuthServiceImpl.java`
- `DashboardService.java`
- `DashboardServiceImpl.java`
- `DisruptionEventService.java`
- `DisruptionEventServiceImpl.java`
- `RiskPredictionService.java`
- `RiskPredictionServiceImpl.java`
- `ShipmentService.java`
- `ShipmentServiceImpl.java`

## 1. What is the service package?

In layered backend architecture, the service layer is where the application decides **what should happen** for a business operation.

Typical flow in this project:

`Controller -> Service -> Repository / External Client -> Database / External System`

### What the service layer does

The service layer usually:
- receives calls from controllers
- applies business rules
- validates domain conditions
- talks to repositories
- coordinates multiple repositories together
- calls external systems when needed
- converts entities into response DTOs
- throws business-level exceptions

### What the service layer should not do

The service layer should not:
- define HTTP endpoints directly
- parse request URLs
- deal with browser/network concerns
- behave like raw SQL-only storage code

That separation is visible in this codebase.

## 2. Interface and implementation pattern

Each service here is split into:
- an interface
- an implementation class

Examples:
- `ShipmentService` and `ShipmentServiceImpl`
- `RiskPredictionService` and `RiskPredictionServiceImpl`
- `AuthService` and `AuthServiceImpl`

### Why this pattern is used

This is a very common Spring design pattern.

#### Interface
The interface defines the service contract.
It answers:
- what operations are available?
- what inputs are accepted?
- what outputs are returned?

#### Implementation
The implementation contains the actual logic.
It answers:
- how is the operation performed?
- which repositories or clients are used?
- what business rules are enforced?

### Why it is useful

Benefits:
- improves abstraction
- helps testing and mocking
- keeps controller dependent on contract, not concrete class
- makes future replacement easier

Example:
`ShipmentController` depends on `ShipmentService`, not directly on `ShipmentServiceImpl`.

## 3. Core Spring concepts used in the service package

## `@Service`
Every implementation class is marked with `@Service`.

Meaning:
- Spring detects it as a service bean
- Spring creates and manages the object
- the object can be injected into controllers or other services

Examples:
- `ShipmentServiceImpl`
- `RiskPredictionServiceImpl`
- `AuthServiceImpl`

### Concept

This is part of Spring's dependency injection model. The framework manages the lifecycle of service objects.

## `@RequiredArgsConstructor`
Used with Lombok in service implementations.

Meaning:
- constructor is generated automatically for final fields
- dependencies are injected through constructor injection

### Why constructor injection is preferred

- dependencies are explicit
- fields can stay `final`
- easier to test
- safer than field injection

## `@Transactional`
Used on write-heavy service methods.

Meaning:
- the method runs inside a database transaction
- if something fails, changes can roll back

### Concept

A transaction is a unit of work that should either succeed completely or fail completely.
This is critical when several database actions belong to one business action.

## 4. How the service package fits this project

This project is a supply chain backend. The service package is responsible for the main use cases:
- user authentication
- shipment creation and status updates
- disruption-event ingestion
- risk prediction
- alert generation and reading
- dashboard summary calculation

The important architectural point is that services here are not only CRUD wrappers. Several of them perform **aggregation**, **orchestration**, and **domain rule enforcement**.

## 5. `AuthService` and `AuthServiceImpl`

Files:
- `src/main/java/com/supplychain/service/AuthService.java`
- `src/main/java/com/supplychain/service/AuthServiceImpl.java`

## Interface role

`AuthService` defines two operations:
- `register(RegisterRequest req)`
- `login(LoginRequest req)`

### Concept

This tells us authentication is treated as a business service, not as logic inside the controller.

## Implementation role

`AuthServiceImpl` performs the actual registration and login logic.

Dependencies used:
- `UserRepository`
- `PasswordEncoder`
- `JwtUtil`

### Why these dependencies matter

- `UserRepository` loads and saves users
- `PasswordEncoder` securely hashes and verifies passwords
- `JwtUtil` generates JWT tokens

## `register()` concept and code flow

This method performs these steps:

1. Check whether the email already exists.
2. If it exists, throw an error.
3. Build a new `User` entity.
4. Hash the password using `passwordEncoder.encode(...)`.
5. Assign default role `USER`.
6. Save the user.
7. Generate a JWT token.
8. Build and return `AuthResponse`.

### Important business rule

New users are always registered with role `USER`.
That is not a database concern or controller concern. It is a business rule, so it belongs in the service layer.

### Important security concept

The raw password is never stored directly.
The service converts it into a password hash first.

That is why the service layer is important: it is the right place to enforce secure domain behavior.

## `login()` concept and code flow

This method performs:

1. Find user by email.
2. If no user is found, throw `BadCredentialsException`.
3. Compare raw password with stored hash using `passwordEncoder.matches(...)`.
4. If password does not match, throw `BadCredentialsException`.
5. Generate JWT token.
6. Return `AuthResponse`.

### Concept explanation

Authentication is not only database lookup. It is a domain workflow:
- identify user
- verify secret
- issue access token

That workflow belongs in the service layer.

## Helper method: `buildAuthResponse()`

This private method constructs the `AuthResponse` object.

### Why this helper is useful

Both `register()` and `login()` need the same response-building logic.
Using a helper:
- avoids code duplication
- keeps main methods readable
- centralizes response construction

## 6. `ShipmentService` and `ShipmentServiceImpl`

Files:
- `src/main/java/com/supplychain/service/ShipmentService.java`
- `src/main/java/com/supplychain/service/ShipmentServiceImpl.java`

## Interface role

`ShipmentService` defines shipment-related operations:
- create shipment
- list shipments
- get shipment detail
- fetch shipment by id
- update shipment status
- delete shipment
- get active shipments

### Concept

This interface models the shipment-related use cases of the system, not just table operations.

## Implementation dependencies

`ShipmentServiceImpl` uses:
- `ShipmentRepository`
- `ShipmentRouteRepository`
- `RiskPredictionRepository`
- `AlertRepository`

### Concept: service aggregation

This service combines data from several sources.
That means it is more than a simple one-table CRUD service.

## `createShipment()` concept and code flow

This method does the following:

1. Generate a tracking number.
2. Build a `Shipment` entity from `CreateShipmentRequest`.
3. Set default status to `PENDING`.
4. Save the shipment.
5. If waypoints are present, convert them into `ShipmentRoute` entities.
6. Save all waypoints.
7. Return a response DTO.

### Code concept: entity construction from DTO

This method is a clear example of request DTO to entity mapping.
The incoming request is not saved directly. Instead, the service decides how the entity should be built.

### Business rule in code

The line assigning `ShipmentStatus.PENDING` is important.
A newly created shipment starts in `PENDING` state.
This is a domain rule and belongs in the service layer.

### Why `@Transactional` matters here

Shipment creation and waypoint saving are part of one logical action.
If waypoint saving fails after shipment saving, the transaction can roll back to keep data consistent.

## `getShipments()` concept and code flow

This method supports three cases:
- search-based listing
- status-filtered listing
- full listing

Then for each shipment it:
- queries the latest risk prediction
- maps the shipment plus prediction into `ShipmentResponse`

### Important concept: summary list response

The list endpoint returns `ShipmentResponse`, not the full shipment entity.
That response includes risk-related summary information from a different repository.

This is an example of **read-side aggregation**.
The service composes a list-friendly DTO for the frontend.

## `getShipmentDetail()` concept and code flow

This method performs:

1. Load shipment by id.
2. Load route waypoints.
3. Load latest risk prediction.
4. Load alerts for that shipment.
5. Merge all of them into `ShipmentDetailResponse`.

### Important concept: composite DTO construction

The returned object is not a direct database entity.
It is a combined representation of:
- shipment data
- route data
- risk data
- alert data

This is exactly the kind of composition the service layer should perform.

## `getShipmentById()` concept

This method returns the raw `Shipment` entity.
It is used internally by other services or internal logic when the domain object itself is needed.

### Concept

Sometimes services expose both:
- public DTO-focused methods
- internal entity-focused methods

That separation is visible here.

## `updateStatus()` concept and code flow

This method:

1. Loads the shipment.
2. Updates its status.
3. Optionally updates actual departure and actual arrival.
4. Saves the shipment.
5. Returns a shipment response DTO.

### Important concept

This is a focused domain update method, not a general update-everything method.
That makes the service easier to understand and protects domain behavior.

## `deleteShipment()` concept

This method:
- checks existence first
- throws `ResourceNotFoundException` if missing
- deletes by id

### Why existence check matters

Without the explicit check, delete behavior may be ambiguous. The service makes the failure case explicit and domain-friendly.

## `getActiveShipments()` concept

Returns shipments in these statuses:
- `PENDING`
- `IN_TRANSIT`
- `AT_WAREHOUSE`

### Why this matters

This method encodes a business idea: what counts as an active shipment.
That definition is domain logic, so it belongs in the service layer.

## Helper methods inside `ShipmentServiceImpl`

### `generateTrackingNumber()`
Generates a unique-looking tracking code.

### `computeRiskLevel()`
Converts numeric risk score into business labels such as:
- `UNKNOWN`
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### `mapToResponse()`
Builds a list-style shipment DTO.

### `mapToDetailResponse()`
Builds the richer detail DTO including:
- waypoints
- latest prediction
- recent alerts

### Why these helpers matter

They keep service methods readable and centralize response mapping logic.

## 7. `RiskPredictionService` and `RiskPredictionServiceImpl`

Files:
- `src/main/java/com/supplychain/service/RiskPredictionService.java`
- `src/main/java/com/supplychain/service/RiskPredictionServiceImpl.java`

This is the most orchestration-heavy service in the package.

## Interface role

Defines three operations:
- predict for one shipment
- predict for all active shipments
- get latest prediction

## Implementation dependencies

`RiskPredictionServiceImpl` uses:
- `ShipmentRepository`
- `RiskPredictionRepository`
- `DisruptionEventRepository`
- `EventShipmentImpactRepository`
- `MLServiceClient`
- `AlertService`

### Important concept: orchestration service

This service coordinates:
- internal entities
- event discovery
- external ML prediction
- persistence of results
- alert generation

That is a classic example of a business orchestration service.

## `predictForShipment()` concept and code flow

This method performs a multi-step workflow:

1. Load shipment by id.
2. Reject prediction if shipment is `DELIVERED` or `CANCELLED`.
3. Find nearby disruption events.
4. Send shipment and event data to the ML service.
5. Receive prediction result.
6. attach shipment to prediction.
7. Save prediction.
8. Save event-shipment impact records.
9. Trigger alerts if risk is high.
10. Return mapped prediction response.

### Why this method is important

It shows what a real service layer often does in production systems:
- enforce domain rules
- call external services
- persist results
- create side effects
- produce API-ready output

### Domain rule in code

Prediction is not allowed for completed or cancelled shipments.
That is not a controller rule. It is domain logic and belongs in the service layer.

### External integration concept

`MLServiceClient` is called from the service layer.
This is correct because prediction is part of business workflow, not HTTP endpoint definition.

### Side-effect concept

High-risk prediction can create alerts.
That means one service action leads to another domain action.
This is a normal and important service-layer responsibility.

## `predictAll()` concept and code flow

This method:
- fetches active shipments
- runs `predictForShipment()` for each shipment
- collects all prediction responses

### Concept explanation

This is a batch-processing service method.
It reuses the single-shipment logic rather than duplicating the code.

That is good design because:
- logic stays consistent
- maintenance becomes easier
- bugs are less likely

## `getLatestPrediction()` concept

This method:
- finds the most recent prediction for a shipment
- throws error if not found
- loads shipment info
- returns a response DTO

### Concept explanation

This is a read-focused service method, but even here the service still performs mapping and error handling rather than exposing raw repository behavior.

## Helper methods in `RiskPredictionServiceImpl`

### `findNearbyEvents()`
Looks for active disruption events near the shipment origin.
It uses approximate geographic filtering.

#### Concept
This is domain-specific search logic. It belongs in the service because it defines what events are considered relevant to a shipment.

### `saveImpactRecords()`
Stores event-shipment relationships if not already present.

#### Concept
This preserves explainability of predictions by recording which events were considered impactful.

### `triggerAlertsIfNeeded()`
Creates alerts when score crosses thresholds.

Threshold logic:
- `>= 0.9` -> critical alert
- `>= 0.7` -> high-risk alert

#### Concept
This is business rule centralization. Risk thresholds should live in one place, not be scattered across controllers or UI.

### `computeRiskLevel()`
Transforms numeric score into business label.

### `mapToResponse()`
Builds `RiskPredictionResponse` from prediction plus shipment.

## 8. `DisruptionEventService` and `DisruptionEventServiceImpl`

Files:
- `src/main/java/com/supplychain/service/DisruptionEventService.java`
- `src/main/java/com/supplychain/service/DisruptionEventServiceImpl.java`

## Interface role

Defines operations to:
- get all events
- get active events
- fetch and store latest news
- find nearby events for a location

## Implementation dependencies

Uses:
- `DisruptionEventRepository`
- `NewsApiClient`

### Concept

This service connects the application to external news-derived disruption data.

## `getAllEvents()` concept

Returns paginated events mapped into `DisruptionEventResponse`.

### Concept explanation

This is a read service, but it still adds value by mapping entities into API DTOs.

## `getActiveEvents()` concept

Returns only active disruption events.

### Concept explanation

This is domain-level filtering. The service decides what subset is relevant to the application behavior.

## `scheduledNewsFetch()` concept

This method is annotated with `@Scheduled`.
It triggers periodic fetching based on the cron configured in application properties.

### Important concept: scheduled background service task

Not all service methods are called by controllers. Some are triggered automatically by time-based scheduling.

That shows service layer is not only request-response driven. It can also run system maintenance or ingestion workflows.

## `fetchAndStoreLatestNews()` concept and code flow

This method:

1. Calls `newsApiClient.fetchDisruptionEvents()`.
2. Iterates through fetched events.
3. Uses `sourceUrl` to check whether event already exists.
4. Saves only new events.
5. Returns the count of new events saved.

### Important concept: deduplication

The service prevents duplicate event storage by checking `sourceUrl`.
This is an application rule, so it fits naturally in the service layer.

## `findEventsNearLocation()` concept

This method converts a radius in kilometers into an approximate latitude-longitude delta and queries nearby active events.

### Concept explanation

This is geographic approximation logic. It is domain-specific and service-level because it defines how event proximity is calculated for the application.

### `mapToResponse()` helper
Builds `DisruptionEventResponse` from entity.

## 9. `AlertService` and `AlertServiceImpl`

Files:
- `src/main/java/com/supplychain/service/AlertService.java`
- `src/main/java/com/supplychain/service/AlertServiceImpl.java`

## Interface role

Defines operations to:
- list alerts
- mark alert as read
- create alert internally
- count unread alerts

### Important design note

The interface includes both externally used methods and an internally used method `createAlert(...)`.
That shows services are used by both controllers and other services.

## Implementation dependency

Uses:
- `AlertRepository`

## `getAlerts()` concept

This method:
- optionally filters unread alerts
- orders results by creation time descending
- maps alerts into `AlertResponse`

### Concept explanation

The service controls presentation-friendly behavior such as ordering and filtering before data reaches the controller.

## `markAsRead()` concept

This method:
- loads alert by id
- throws if not found
- sets `isRead` to true
- saves the alert
- returns mapped response

### Domain concept

Marking an alert as read is a state transition in the alert lifecycle. That transition belongs in the service layer.

## `createAlert()` concept

This method is called internally by other services, especially by risk prediction logic.
It builds an `Alert` entity and saves it.

### Important concept: service-to-service collaboration

The risk service does not directly use `AlertRepository`. Instead, it asks `AlertService` to create alerts.

This is better because:
- alert creation rules stay centralized
- coupling is reduced
- future alert logic can evolve in one place

## `getUnreadCount()` concept

Returns unread alert count.
This is useful for dashboard metrics or notification badges.

## `mapToResponse()` helper

Maps alert entity into `AlertResponse`.
The helper also exposes shipment-related fields like tracking number, which are useful to the frontend.

## 10. `DashboardService` and `DashboardServiceImpl`

Files:
- `src/main/java/com/supplychain/service/DashboardService.java`
- `src/main/java/com/supplychain/service/DashboardServiceImpl.java`

## Interface role

Defines one method:
- `getSummary()`

### Concept

A dashboard is typically not a direct database entity. It is an aggregation use case. That is why a dedicated service exists.

## Implementation dependencies

Uses:
- `ShipmentRepository`
- `DisruptionEventRepository`
- `RiskPredictionRepository`
- `AlertRepository`

## `getSummary()` concept and code flow

This method computes:
- total shipments
- shipments by status
- average risk score
- high-risk and critical-risk counts
- active disruption events
- critical disruption events
- unread alerts

Then it builds `DashboardSummaryResponse`.

### Important concept: read aggregation service

This service does not manage one entity. It combines metrics from multiple domains into one summary object.

That is exactly the kind of responsibility dashboards usually require.

### Another important detail

The average risk score is rounded before returning.
That is presentation-aware logic placed in service mapping, which is appropriate because it shapes the API output.

## 11. Cross-service concepts visible in this package

## A. Mapping from entity to DTO

Almost every service implementation contains mapping logic.

Examples:
- `Alert -> AlertResponse`
- `Shipment + RiskPrediction -> ShipmentResponse`
- `Shipment + Routes + Alerts + Prediction -> ShipmentDetailResponse`
- `RiskPrediction + Shipment -> RiskPredictionResponse`

### Why this matters

The service layer is the ideal place to shape API data because it already knows the domain context and the client needs.

## B. Exception handling and domain errors

Services throw exceptions such as:
- `ResourceNotFoundException`
- `IllegalArgumentException`
- `BadCredentialsException`
- `IllegalStateException`

### Concept

This keeps failure conditions explicit.
Services express business failures clearly instead of returning null or hiding errors.

## C. Reuse through helper methods

Several services use private helpers for:
- mapping
- risk-level calculation
- tracking number generation
- alert triggering
- event searching

### Concept

This improves readability and keeps core workflows easier to follow.

## D. Reuse through service collaboration

Example:
- `RiskPredictionServiceImpl` calls `AlertService`

### Why this is good design

One service can depend on another when the second service owns a specific domain responsibility.
This avoids bypassing service boundaries.

## E. Read services vs write services

Some methods are mainly read-focused:
- `getSummary()`
- `getAllEvents()`
- `getLatestPrediction()`

Some are write-focused:
- `createShipment()`
- `register()`
- `markAsRead()`
- `predictForShipment()`
- `fetchAndStoreLatestNews()`

### Concept

The service layer handles both command-style operations and query-style operations.

## 12. Code-driven understanding of service responsibilities

A useful way to understand the package is to classify each service by responsibility type.

### Authentication service
- owns login and registration workflow

### Transactional domain service
- shipment creation and status updates

### Orchestration service
- risk prediction with ML client, event lookup, impact persistence, alerts

### Integration service
- disruption-event ingestion from external news API

### Notification service
- alert listing, reading, creation

### Aggregation service
- dashboard summary computation

This package is strong because each service has a recognizable responsibility pattern.

## 13. Why the service package is important in clean architecture

The service package acts as the **application behavior layer**.

If controllers are the entry points and repositories are the data access layer, the service layer is where the system's actual decisions are made.

Without a good service layer, logic gets scattered into:
- controllers
- repositories
- utility classes

That makes a codebase harder to understand and maintain.

This project avoids that problem reasonably well by keeping most domain workflows in services.

## 14. Simple end-to-end examples from this codebase

## Example 1: Create shipment
1. `ShipmentController` receives `CreateShipmentRequest`.
2. `ShipmentServiceImpl.createShipment()` generates tracking number.
3. Shipment status is set to `PENDING`.
4. Shipment and routes are saved.
5. `ShipmentResponse` is returned.

### Service-layer concept shown
- DTO to entity mapping
- business defaults
- transactional save
- DTO response mapping

## Example 2: Predict risk for one shipment
1. `RiskController` calls `predictForShipment()`.
2. Service validates shipment status.
3. Service finds nearby disruption events.
4. Service calls ML microservice.
5. Service saves prediction.
6. Service saves impact records.
7. Service may create alerts.
8. Service returns prediction response.

### Service-layer concept shown
- orchestration
- domain validation
- external integration
- side effects
- DTO mapping

## Example 3: Dashboard summary
1. `DashboardController` calls `getSummary()`.
2. `DashboardServiceImpl` queries several repositories.
3. Service aggregates metrics.
4. Service builds `DashboardSummaryResponse`.

### Service-layer concept shown
- multi-source aggregation
- presentation-oriented summary shaping

## 15. Short summary

The `service` package is the business core of this backend. It sits between controllers and repositories or external clients, enforcing domain rules, coordinating workflows, handling transactions, mapping entities to DTOs, and integrating with external systems like JWT generation, news ingestion, and ML risk prediction. The package contains simple services such as alert management, but also more advanced orchestration services like `RiskPredictionServiceImpl`, which combines shipment state, disruption events, external prediction, impact recording, and alert generation into one coherent business workflow. This is why the service layer is the most important application layer in this project: it contains the real behavior of the system.
