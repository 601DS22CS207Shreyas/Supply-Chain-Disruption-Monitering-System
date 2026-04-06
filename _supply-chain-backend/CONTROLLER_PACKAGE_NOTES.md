# Controller Package Notes

The `controller` package contains the REST API entry points of the application. These classes receive HTTP requests from the client, extract request data, call the service layer, and return HTTP responses.

Relevant package:
`src/main/java/com/supplychain/controller`

Files inside this package:
- `AlertController.java`
- `AuthController.java`
- `DashboardController.java`
- `DisruptionController.java`
- `RiskController.java`
- `ShipmentController.java`

## 1. What is a controller package?

In Spring Boot, controllers are the classes that expose backend functionality as HTTP endpoints.

They answer questions like:
- which URL should handle a request?
- which HTTP method should be used?
- what request body or query parameters are needed?
- what response should be returned?

So the controller package is the **API layer** of the backend.

### Basic flow

`Client -> Controller -> Service -> Repository / External API -> Response`

Controllers should usually stay thin.
They should:
- accept input
- validate request DTOs
- delegate work to services
- return DTO responses

They should not contain heavy business logic.

That design is followed well in this project.

## 2. Common annotations used in this package

## `@RestController`
Used on every controller class.

Examples:
- `AlertController.java` line 12
- `ShipmentController.java` line 19

### Meaning

This tells Spring that the class handles REST requests and that returned objects should be serialized as JSON.

## `@RequestMapping`
Used at class level to define the base URL path.

Examples:
- `AuthController.java` line 14 uses `/api/auth`
- `ShipmentController.java` line 20 uses `/api/shipments`

### Meaning

This is the common URL prefix for all endpoints inside that controller.

## `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
These map methods to HTTP verbs.

Concept:
- `GET` = read data
- `POST` = create or trigger action
- `PUT` = update data
- `DELETE` = remove data

## `@PathVariable`
Used when a value comes from the URL path.

Example:
- `ShipmentController.java` line 37 gets shipment id from `/api/shipments/{id}`

## `@RequestParam`
Used when a value comes from query parameters.

Example:
- `AlertController.java` line 22 reads `unreadOnly`
- `ShipmentController.java` lines 29 and 30 read `search` and `status`

## `@RequestBody`
Used when JSON data from the request body should be converted into a DTO.

Example:
- `AuthController.java` lines 22 and 28
- `ShipmentController.java` lines 43 and 51

## `@Valid`
Used to trigger validation on request DTOs.

Examples:
- `AuthController.java` lines 22 and 28
- `ShipmentController.java` lines 43 and 51

### Meaning

Spring checks validation annotations in the DTO before the service method runs.
If the request is invalid, the controller will not continue normally.

## `ResponseEntity`
Used by all controllers to wrap the response.

Concept:
`ResponseEntity` allows control over:
- response body
- HTTP status code

This is why some endpoints return `200 OK`, one returns `201 Created`, and delete returns `204 No Content`.

## `@PreAuthorize`
Used on some methods to restrict access by role.

Examples:
- `DisruptionController.java` line 38
- `RiskController.java` line 33
- `ShipmentController.java` line 57

Concept:
This is method-level authorization.
Only users with the required role can call those endpoints.

## 3. `AuthController.java`

File:
`src/main/java/com/supplychain/controller/AuthController.java`

Reference:
- `AuthController.java` lines 13 to 30

### Purpose

Handles authentication-related endpoints.

### Base path
`/api/auth`

### Methods

#### `register()`
- `AuthController.java` lines 20 to 24

Endpoint:
`POST /api/auth/register`

Input:
- `RegisterRequest`

Output:
- `AuthResponse`

HTTP status:
- `201 Created`

### Concept explanation

This endpoint is used to create a new user account.
It validates the incoming registration DTO and delegates the actual logic to `AuthService`.

Important controller concept:
The controller does not hash the password or generate the token itself. It only forwards the request to the service.

#### `login()`
- `AuthController.java` lines 26 to 29

Endpoint:
`POST /api/auth/login`

Input:
- `LoginRequest`

Output:
- `AuthResponse`

HTTP status:
- `200 OK`

### Concept explanation

This endpoint handles user login.
Again, the controller only receives the request, validates it, and delegates to the service.

### Why this controller is important

This is the public entry point to the application's JWT-based authentication flow.

## 4. `ShipmentController.java`

File:
`src/main/java/com/supplychain/controller/ShipmentController.java`

Reference:
- `ShipmentController.java` lines 19 to 61

### Purpose

Handles shipment-related API operations.

### Base path
`/api/shipments`

This is the largest controller in the package because shipment management is a major feature of the application.

### Methods

#### `getShipments()`
- `ShipmentController.java` lines 26 to 33

Endpoint:
`GET /api/shipments`

Query parameters:
- `search`
- `status`
- pagination values through `Pageable`

Output:
- `Page<ShipmentResponse>`

### Concept explanation

This endpoint returns a paginated shipment list.
It supports:
- searching
- filtering by shipment status
- pagination and sorting

### Important concept: pagination

The method uses:
- `Pageable`
- `@PageableDefault`

This allows the client to request manageable chunks of data instead of loading everything at once.

That improves:
- performance
- scalability
- frontend control over tables and lists

#### `getShipmentDetail()`
- `ShipmentController.java` lines 35 to 39

Endpoint:
`GET /api/shipments/{id}`

Output:
- `ShipmentDetailResponse`

### Concept explanation

This endpoint returns one full shipment detail view.
Unlike the list endpoint, this returns a richer object.

This demonstrates a common REST design pattern:
- list endpoint returns summary DTO
- detail endpoint returns detailed DTO

#### `createShipment()`
- `ShipmentController.java` lines 41 to 45

Endpoint:
`POST /api/shipments`

Input:
- `CreateShipmentRequest`

Output:
- `ShipmentResponse`

HTTP status:
- `201 Created`

### Concept explanation

This endpoint creates a new shipment.
It validates the request body using `@Valid` and returns a created response.

Important controller idea:
Using `201 Created` is more semantically correct than returning generic `200 OK` for resource creation.

#### `updateStatus()`
- `ShipmentController.java` lines 47 to 53

Endpoint:
`PUT /api/shipments/{id}/status`

Input:
- `UpdateShipmentStatusRequest`

Output:
- `ShipmentResponse`

### Concept explanation

This endpoint performs a focused update, not a full shipment edit.
It is designed around one business action: status change.

This is a good API design pattern because it makes the endpoint purpose explicit.

#### `deleteShipment()`
- `ShipmentController.java` lines 55 to 60

Endpoint:
`DELETE /api/shipments/{id}`

Output:
- no response body

HTTP status:
- `204 No Content`

Security:
- admin-only via `@PreAuthorize("hasRole('ADMIN')")`

### Concept explanation

This endpoint removes a shipment and is protected so normal users cannot perform deletion.

This shows two important controller concepts together:
- destructive actions often require stronger authorization
- `204 No Content` is the standard response when deletion succeeds and nothing needs to be returned

## 5. `RiskController.java`

File:
`src/main/java/com/supplychain/controller/RiskController.java`

Reference:
- `RiskController.java` lines 12 to 36

### Purpose

Exposes APIs related to shipment risk prediction.

### Base path
`/api/risk`

### Methods

#### `getLatestPrediction()`
- `RiskController.java` lines 19 to 23

Endpoint:
`GET /api/risk/{shipmentId}`

Output:
- `RiskPredictionResponse`

### Concept explanation

Returns the most recent stored prediction for a shipment.
This is a read endpoint.

#### `predictForShipment()`
- `RiskController.java` lines 25 to 29

Endpoint:
`POST /api/risk/predict/{shipmentId}`

Output:
- `RiskPredictionResponse`

### Concept explanation

This endpoint actively triggers a fresh prediction.
It uses `POST` because it causes an action and may create new prediction records.

Important REST concept:
Even though this is not creating a classic resource directly from request body, `POST` is appropriate because it triggers server-side processing with side effects.

#### `predictAll()`
- `RiskController.java` lines 31 to 35

Endpoint:
`POST /api/risk/predict-all`

Output:
- `List<RiskPredictionResponse>`

Security:
- admin-only

### Concept explanation

This endpoint runs batch prediction for all active shipments.
Because it can trigger a larger system-wide operation, it is restricted to admin users.

This is a strong example of an action endpoint rather than a simple CRUD endpoint.

## 6. `DisruptionController.java`

File:
`src/main/java/com/supplychain/controller/DisruptionController.java`

Reference:
- `DisruptionController.java` lines 16 to 46

### Purpose

Handles disruption-event endpoints.

### Base path
`/api/disruptions`

### Methods

#### `getAllEvents()`
- `DisruptionController.java` lines 23 to 28

Endpoint:
`GET /api/disruptions`

Output:
- `Page<DisruptionEventResponse>`

### Concept explanation

Returns paginated disruption events.
Like shipment listing, this supports scalable data access through `Pageable`.

#### `getActiveEvents()`
- `DisruptionController.java` lines 30 to 34

Endpoint:
`GET /api/disruptions/active`

Output:
- `List<DisruptionEventResponse>`

### Concept explanation

Returns only active disruption events.
This is a filtered read endpoint designed for current, relevant events.

#### `fetchLatestNews()`
- `DisruptionController.java` lines 36 to 44

Endpoint:
`POST /api/disruptions/fetch-latest`

Output:
- `Map<String, Object>`

Security:
- admin-only

### Concept explanation

This endpoint manually triggers a news fetch from the external source.
It is not a normal CRUD endpoint. It is an operational action endpoint.

The response contains:
- a message
- the number of new events added

Important controller idea:
Sometimes a controller endpoint exists to trigger system behavior, not only to create/read/update/delete one entity.

## 7. `AlertController.java`

File:
`src/main/java/com/supplychain/controller/AlertController.java`

Reference:
- `AlertController.java` lines 12 to 31

### Purpose

Handles alert-related endpoints.

### Base path
`/api/alerts`

### Methods

#### `getAlerts()`
- `AlertController.java` lines 19 to 25

Endpoint:
`GET /api/alerts`

Query parameter:
- `unreadOnly`

Output:
- `Page<AlertResponse>`

### Concept explanation

Returns alerts with optional unread filtering and pagination.

This demonstrates a useful controller design idea:
A single endpoint can support simple filtering through query parameters rather than needing many separate URLs.

#### `markAsRead()`
- `AlertController.java` lines 27 to 30

Endpoint:
`PUT /api/alerts/{id}/read`

Output:
- `AlertResponse`

### Concept explanation

This endpoint updates one aspect of an alert: its read status.

Again, this is a focused action endpoint rather than a generic full update endpoint.
This makes the API intention very clear.

## 8. `DashboardController.java`

File:
`src/main/java/com/supplychain/controller/DashboardController.java`

Reference:
- `DashboardController.java` lines 11 to 22

### Purpose

Provides dashboard summary data.

### Base path
`/api/dashboard`

### Method

#### `getSummary()`
- `DashboardController.java` lines 18 to 21

Endpoint:
`GET /api/dashboard/summary`

Output:
- `DashboardSummaryResponse`

### Concept explanation

This endpoint gives the frontend one aggregated dashboard object.
It is an example of a read endpoint designed around a screen or feature rather than around a single database table.

This is very common in real applications.
Frontend screens often need aggregated data, and controllers expose dedicated endpoints for that purpose.

## 9. Role of controllers in the overall architecture

In this project, the controller layer sits above the service layer.

Responsibilities of controllers here:
- define API paths
- define HTTP methods
- receive request DTOs
- apply validation through `@Valid`
- pass parameters to services
- return response DTOs
- attach HTTP status codes
- apply method-level authorization where needed

Responsibilities they do not take on:
- business calculations
- repository access
- JWT parsing
- database mapping logic
- heavy domain rules

That separation is important because it keeps the code maintainable.

## 10. Thin controller concept

These controllers are intentionally thin.

Example:
- `AuthController` does not generate tokens itself
- `ShipmentController` does not generate tracking numbers
- `RiskController` does not compute risk
- `DisruptionController` does not fetch news directly

Instead, controllers delegate to services.

This is good architecture because:
- logic stays reusable
- controllers stay easy to read
- testing becomes easier
- responsibilities remain clear

## 11. Pagination concept in controller package

Some controller methods use:
- `Pageable`
- `@PageableDefault`

Examples:
- `AlertController.java` lines 21 to 24
- `DisruptionController.java` lines 25 to 27
- `ShipmentController.java` lines 28 to 32

### Why pagination matters

Without pagination, listing endpoints could become inefficient as data grows.
By accepting a `Pageable`, the controller allows the client to control:
- page number
- page size
- sorting

This is an important scalable API pattern.

## 12. Validation concept in controller package

Controllers use `@Valid` when receiving request bodies.

Examples:
- `AuthController.java` line 22
- `AuthController.java` line 28
- `ShipmentController.java` line 43
- `ShipmentController.java` line 51

### Why validation belongs here

The controller is the API boundary.
That makes it the right place to ensure incoming data matches the DTO rules before business logic starts.

This prevents invalid payloads from reaching deeper layers.

## 13. Authorization concept in controller package

Some endpoints are restricted using `@PreAuthorize`.

Examples:
- shipment delete is admin-only
- disruption fetch-latest is admin-only
- risk batch prediction is admin-only

### Meaning

The controller method is protected by Spring Security before the method body is executed.
Only users with the required role can access those operations.

This is especially suitable for:
- destructive actions
- operational triggers
- batch/system-wide actions

## 14. REST design patterns visible in this package

This controller package shows several useful REST API design patterns:

- resource-based endpoints like `/api/shipments/{id}`
- action-based endpoints like `/api/risk/predict/{shipmentId}`
- filtered endpoints like `/api/disruptions/active`
- status-specific update endpoints like `/api/alerts/{id}/read`
- dashboard/summary endpoints designed around frontend needs
- paginated list endpoints
- role-protected administrative endpoints

This means the controller design is not purely CRUD. It supports real application use cases.

## 15. Simple runtime picture

When the client makes a request:
1. The correct controller method is selected based on URL and HTTP method.
2. Spring extracts path variables, query params, and request body.
3. If `@Valid` is used, DTO validation happens.
4. The controller calls the appropriate service.
5. The service returns a DTO or result.
6. The controller wraps it in `ResponseEntity` and sends JSON back.

So the controller package is the public HTTP face of the backend.

## 16. Short summary

The `controller` package defines all REST API endpoints of the application. Each controller is responsible for mapping URLs and HTTP methods to Java methods, receiving request data, validating request DTOs, calling the service layer, and returning response DTOs with appropriate HTTP status codes. The controllers in this project are thin and well-structured: business logic stays in services, while controllers focus on API behavior, pagination, validation, and authorization. Together, they form the entry layer through which the frontend interacts with the backend.
