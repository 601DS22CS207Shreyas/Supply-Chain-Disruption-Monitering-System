# DTO Package Notes

The `dto` package contains the data objects used to transfer information between the client and the backend. DTO stands for **Data Transfer Object**.

Relevant package:
`src/main/java/com/supplychain/dto`

Subpackages inside `dto`:
- `request`
- `response`

## 1. What is a DTO?

A DTO is an object used to carry data from one layer to another without exposing the internal database entity directly.

In this project, DTOs are mainly used for:
- receiving data from the frontend in API requests
- sending structured data back to the frontend in API responses

### Why DTOs are used instead of entities directly

Using DTOs is a very important backend design concept.

Benefits:
- protects internal entity structure
- avoids exposing sensitive fields
- lets the API return only useful data
- allows request validation
- keeps database models separate from API contracts
- makes future API changes easier

### Simple difference

- entity = database-oriented object
- DTO = API-oriented object

Example:
- `User` entity may contain password hash
- `AuthResponse` DTO sends token, email, name, role, and expiry only

So DTOs are the **communication format** of the API.

## 2. Structure of DTO package in this project

The package is split into two parts:
- `request` DTOs
- `response` DTOs

### `request` DTOs
These represent the data the client sends to the backend.

### `response` DTOs
These represent the data the backend sends back to the client.

This separation is good design because input and output usually have different needs.

## 3. DTO concepts used in this project

### `@Data`
Many DTO classes use Lombok's `@Data`.

Meaning:
- generates getters
- generates setters
- generates `toString()`
- generates `equals()` and `hashCode()`

This reduces boilerplate code.

### `@Builder`
Most response DTOs use Lombok's `@Builder`.

Meaning:
- makes object creation cleaner
- useful when there are many fields
- helps service classes construct responses clearly

Example:
A service can build a response step by step instead of using a long constructor.

### Validation annotations
Request DTOs use validation annotations such as:
- `@NotBlank`
- `@NotNull`
- `@Email`
- `@Size`

Concept:
These annotations ensure invalid request data is rejected before business logic runs.

This is a very important API design practice because validation belongs at the system boundary.

## 4. Request DTOs

Request DTOs are inside:
`src/main/java/com/supplychain/dto/request`

These classes define what the client must send for specific operations.

## 5. `CreateShipmentRequest.java`

File:
`src/main/java/com/supplychain/dto/request/CreateShipmentRequest.java`

Reference:
- `CreateShipmentRequest.java` lines 11 to 52

### Purpose

This DTO is used when the client wants to create a new shipment.

### Important fields
- `origin`
- `destination`
- `carrier`
- `transportMode`
- `cargoDescription`
- `cargoWeightKg`
- `cargoValueUsd`
- `scheduledDeparture`
- `scheduledArrival`
- `originLat`, `originLng`
- `destinationLat`, `destinationLng`
- `waypoints`

### Validation used
- `origin` uses `@NotBlank` at line 14
- `destination` uses `@NotBlank` at line 17
- `carrier` uses `@NotBlank` at line 20
- `transportMode` uses `@NotNull` at line 23
- `scheduledDeparture` uses `@NotNull` at line 30
- `scheduledArrival` uses `@NotNull` at line 33

### Concept explanation

This DTO shows a common request-design pattern:
- required business fields are validated
- optional fields are left flexible
- route-related data is grouped into nested waypoint objects

### Nested DTO concept: `WaypointRequest`
- `CreateShipmentRequest.java` lines 43 to 51

This is a static inner DTO representing intermediate route points.

Why this is useful:
- keeps waypoint structure logically attached to shipment creation
- allows one request to create both shipment and route details
- models hierarchical JSON data clearly

This is an example of a **composite request DTO**, where one request contains child objects.

## 6. `LoginRequest.java`

File:
`src/main/java/com/supplychain/dto/request/LoginRequest.java`

Reference:
- `LoginRequest.java` lines 7 to 15

### Purpose

This DTO is used when a user logs in.

### Fields
- `email`
- `password`

### Validation
- `email` uses `@NotBlank` and `@Email` at line 10
- `password` uses `@NotBlank` at line 13

### Concept explanation

This DTO is intentionally minimal.
A login request should carry only what is needed for authentication.

This is a good DTO design principle:
- keep request objects focused
- do not ask for unnecessary fields

## 7. `RegisterRequest.java`

File:
`src/main/java/com/supplychain/dto/request/RegisterRequest.java`

Reference:
- `RegisterRequest.java` lines 8 to 19

### Purpose

This DTO is used when a new user registers.

### Fields
- `fullName`
- `email`
- `password`

### Validation
- `fullName` uses `@NotBlank` at line 11
- `email` uses `@NotBlank` and `@Email` at line 14
- `password` uses `@NotBlank` and `@Size(min = 8)` at line 17

### Concept explanation

This DTO demonstrates boundary-level validation.
Instead of waiting until service logic to reject a weak or missing password, the API validates it immediately.

This improves:
- cleaner controller/service code
- better error reporting to frontend
- stronger input quality

## 8. `UpdateShipmentStatusRequest.java`

File:
`src/main/java/com/supplychain/dto/request/UpdateShipmentStatusRequest.java`

Reference:
- `UpdateShipmentStatusRequest.java` lines 9 to 17

### Purpose

This DTO is used when the client updates a shipment's status.

### Fields
- `status`
- `actualDeparture`
- `actualArrival`

### Validation
- `status` uses `@NotNull` at line 12

### Concept explanation

This is a focused update DTO.
It does not contain all shipment fields because the API operation is not about editing the entire shipment.
It is only about status-related changes.

This is an important REST design concept:
- different operations should use different DTOs
- avoid reusing one big DTO for all operations

That makes APIs clearer and safer.

## 9. Response DTOs

Response DTOs are inside:
`src/main/java/com/supplychain/dto/response`

These classes define what the backend sends back to the client.

In this project, response DTOs are created mainly in the service layer.
They are designed to match frontend needs rather than database table shape.

## 10. `AlertResponse.java`

File:
`src/main/java/com/supplychain/dto/response/AlertResponse.java`

Reference:
- `AlertResponse.java` lines 10 to 20

### Purpose

Represents alert information returned to the client.

### Fields
- `id`
- `shipmentId`
- `trackingNumber`
- `alertType`
- `message`
- `severity`
- `isRead`
- `createdAt`

### Concept explanation

This response DTO is a flattened API shape.
It gives the frontend enough information to display an alert without exposing the full `Alert` entity graph.

This is a common DTO pattern:
- include key related identifiers like `shipmentId`
- include display-friendly fields like `trackingNumber`
- avoid sending the entire nested entity object

## 11. `AuthResponse.java`

File:
`src/main/java/com/supplychain/dto/response/AuthResponse.java`

Reference:
- `AuthResponse.java` lines 7 to 14

### Purpose

Returned after registration or login.

### Fields
- `token`
- `email`
- `fullName`
- `role`
- `expiresInMs`

### Concept explanation

This DTO is the authentication contract between backend and frontend.
After successful login, the frontend gets the JWT token plus the user identity and role data it needs.

Important design idea:
The response returns token metadata, not sensitive internal user data.
For example, it does not return password hash.

## 12. `DashboardSummaryResponse.java`

File:
`src/main/java/com/supplychain/dto/response/DashboardSummaryResponse.java`

Reference:
- `DashboardSummaryResponse.java` lines 6 to 26

### Purpose

This DTO sends summary metrics for the dashboard screen.

### Sections in the DTO
- shipment counts
- risk overview
- disruption counts
- alert counts

### Concept explanation

This is an **aggregation response DTO**.
It combines data from many repositories and services into one compact object.

This is useful because the frontend dashboard usually wants one summary call rather than many separate API calls.

That improves:
- performance
- frontend simplicity
- reduced network overhead

## 13. `DisruptionEventResponse.java`

File:
`src/main/java/com/supplychain/dto/response/DisruptionEventResponse.java`

Reference:
- `DisruptionEventResponse.java` lines 11 to 27

### Purpose

Represents a disruption event shown to the client.

### Fields include
- title and description
- event type and severity
- location and coordinates
- impact radius
- event date
- source information
- active status
- creation time

### Concept explanation

This DTO is designed for event display and analysis.
It mixes:
- descriptive fields
- geographic fields
- source-tracking fields
- state fields

This is a good example of an API DTO built for UI and reporting needs.

## 14. `RiskPredictionResponse.java`

File:
`src/main/java/com/supplychain/dto/response/RiskPredictionResponse.java`

Reference:
- `RiskPredictionResponse.java` lines 8 to 20

### Purpose

Represents the prediction result for shipment delay risk.

### Fields
- `id`
- `shipmentId`
- `trackingNumber`
- `delayProbability`
- `riskLevel`
- `estimatedDelayHours`
- `primaryCause`
- `llmExplanation`
- `modelVersion`
- `predictedAt`

### Important concept: derived field

The `riskLevel` field is not just raw stored data. It is a business-friendly interpretation of the numeric score.

Example idea:
- 0.2 -> LOW
- 0.8 -> HIGH
- 0.95 -> CRITICAL

This is an important DTO concept:
A response DTO can contain **derived or computed data** that makes frontend consumption easier.

## 15. `ShipmentResponse.java`

File:
`src/main/java/com/supplychain/dto/response/ShipmentResponse.java`

Reference:
- `ShipmentResponse.java` lines 10 to 27

### Purpose

This DTO is used for shipment list views.

### Fields
- basic shipment identity fields
- transport and status fields
- schedule info
- latest risk score
- risk level
- creation time

### Concept explanation

This is a **summary response DTO**.
It contains only the data needed for a list/table view.

This is different from `ShipmentDetailResponse`, which is larger.

Important API concept:
- list response DTO = smaller and lighter
- detail response DTO = richer and deeper

This is better than returning the same large object everywhere.

## 16. `ShipmentDetailResponse.java`

File:
`src/main/java/com/supplychain/dto/response/ShipmentDetailResponse.java`

Reference:
- `ShipmentDetailResponse.java` lines 11 to 46

### Purpose

This DTO is used for the detailed shipment view.

### Fields include
- all main shipment fields
- cargo details
- actual and scheduled timing
- coordinates
- waypoints
- latest prediction
- recent alerts

### Nested DTO: `WaypointResponse`
- `ShipmentDetailResponse.java` lines 36 to 45

This nested class represents route waypoints in the response.

### Concept explanation

`ShipmentDetailResponse` is a **rich composite response DTO**.
It includes nested child data and related objects from other domains.

It is built from multiple sources:
- shipment entity
- route entities
- prediction entity
- alert entities

This is a strong example of DTO composition.
The frontend gets one complete object instead of having to call several endpoints and combine everything manually.

## 17. Request DTOs vs Response DTOs in this project

### Request DTOs
Used for incoming client data.
Main focus:
- validation
- correctness
- required fields
- operation-specific payloads

### Response DTOs
Used for outgoing backend data.
Main focus:
- readability
- frontend usability
- derived values
- aggregated information

This separation is one of the strongest design choices in the codebase.

## 18. Validation concept in the DTO package

Request DTOs use Jakarta Validation annotations.

Examples:
- `@NotBlank`
- `@NotNull`
- `@Email`
- `@Size`

### Why validation on DTOs is good

Validation at DTO level means invalid input can be rejected before it enters business logic.

That gives advantages:
- safer API boundary
- less repetitive manual checks in services
- more standardized validation errors

This is especially important in controllers that use `@Valid` on request bodies.

So DTOs and controller validation work together.

## 19. Mapping concept

DTOs are usually not saved directly into the database.
Instead, they are mapped:
- request DTO -> entity
- entity -> response DTO

In this project, service classes handle much of this mapping.

Example mappings:
- `CreateShipmentRequest` -> `Shipment`
- `RiskPrediction` + `Shipment` -> `RiskPredictionResponse`
- `Alert` -> `AlertResponse`

This mapping step is important because it keeps entity models independent from API models.

## 20. Why the dto package is important in clean architecture

The DTO package acts as the **contract boundary** of the application.

That means:
- frontend depends on DTO contract
- controllers accept and return DTOs
- services map between DTOs and entities
- entities remain internal domain/persistence objects

This helps maintain:
- loose coupling
- cleaner API design
- safer data exposure
- easier future refactoring

## 21. Simple runtime picture

When a client sends data:
1. The controller receives a request DTO.
2. Validation annotations check the input.
3. Service maps the DTO into entities or uses the values directly.
4. Business logic runs.
5. Service builds a response DTO.
6. Controller returns the response DTO as JSON.

So the DTO package is active at both entry and exit points of the API.

## 22. Short summary

The `dto` package defines the API communication models of the project. The `request` DTOs describe the exact structure of incoming client data and apply validation rules to ensure correct input. The `response` DTOs define the shape of outgoing API responses and often include aggregated, flattened, or derived values that are easier for the frontend to use. Together, these DTOs separate API contracts from database entities, improve security, support validation, and keep the controller-service architecture clean and maintainable.
