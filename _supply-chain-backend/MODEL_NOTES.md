# Supply Chain Backend Model Notes

These notes explain the classes in the `model` package in simple terms and show how they are connected.

## 1. What the model package does

The `model` package contains JPA entity classes. Each class usually maps to one database table.

- `@Entity` means the class is stored in the database.
- `@Table(name = "...")` sets the database table name.
- `@Id` marks the primary key.
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` means the database generates the ID automatically.
- `@Column(nullable = false)` means the field is required.
- `@Enumerated(EnumType.STRING)` stores enum values as text.
- `@ManyToOne` means many child rows can belong to one parent row.
- `@OneToMany` means one parent row can have many child rows.
- `@JoinColumn(name = "...")` defines the foreign key column.
- `fetch = FetchType.LAZY` means related data is loaded only when needed.
- `cascade = CascadeType.ALL` means operations on the parent affect the child records too.
- `@CreationTimestamp` automatically stores created time.
- `@UpdateTimestamp` automatically stores updated time.
- Lombok annotations like `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, and `@AllArgsConstructor` reduce boilerplate code.

## 2. File-by-file notes

### User

File: `src/main/java/com/supplychain/model/User.java`

Purpose:
Stores application user accounts.

Important fields:
- `id`: primary key
- `email`: unique login email
- `passwordHash`: hashed password
- `fullName`: user's full name
- `role`: user role enum
- `createdAt`: account creation timestamp

Meaning:
This table is for system users, not shipments.

### Shipment

File: `src/main/java/com/supplychain/model/Shipment.java`

Purpose:
Stores the main shipment record.

Important fields:
- `trackingNumber`: unique shipment tracking ID
- `origin`, `destination`: route endpoints
- `carrier`: logistics provider
- `transportMode`: road, sea, air, etc.
- `status`: shipment status enum
- `cargoDescription`, `cargoWeightKg`, `cargoValueUsd`: cargo details
- `scheduledDeparture`, `scheduledArrival`: planned times
- `actualDeparture`, `actualArrival`: real times
- `originLat`, `originLng`, `destinationLat`, `destinationLng`: coordinates
- `createdAt`, `updatedAt`: audit timestamps

Relationships:
- One shipment has many `ShipmentRoute` records
- One shipment has many `RiskPrediction` records
- One shipment has many `Alert` records

### ShipmentRoute

File: `src/main/java/com/supplychain/model/ShipmentRoute.java`

Purpose:
Represents one stop or waypoint in a shipment route.

Important fields:
- `shipment`: parent shipment
- `waypointOrder`: order of the stop
- `city`, `country`: stop location
- `lat`, `lng`: coordinates
- `estimatedArrival`, `actualArrival`: timing at the stop

Meaning:
If one shipment passes through three cities, there can be three `ShipmentRoute` rows.

### RiskPrediction

File: `src/main/java/com/supplychain/model/RiskPrediction.java`

Purpose:
Stores ML-generated delay risk predictions for a shipment.

Important fields:
- `shipment`: related shipment
- `delayProbability`: chance of delay
- `estimatedDelayHours`: expected delay duration
- `primaryCause`: likely reason
- `llmExplanation`: human-readable explanation
- `featureSnapshot`: model input snapshot
- `modelVersion`: model version
- `predictedAt`: when prediction was generated

Meaning:
A shipment can have multiple predictions over time.

### Alert

File: `src/main/java/com/supplychain/model/Alert.java`

Purpose:
Stores notifications related to a shipment.

Important fields:
- `shipment`: related shipment
- `alertType`: alert category enum
- `message`: notification text
- `severity`: alert seriousness
- `isRead`: whether user has read it
- `createdAt`: time created

Meaning:
Alerts are user-facing warnings or updates for a shipment.

### DisruptionEvent

File: `src/main/java/com/supplychain/model/DisruptionEvent.java`

Purpose:
Stores real-world events that may disrupt shipments.

Important fields:
- `title`, `description`: event details
- `eventType`: event category enum
- `severity`: seriousness enum
- `location`, `lat`, `lng`: where it happened
- `impactRadiusKm`: affected radius
- `eventDate`: date of the event
- `sourceUrl`, `sourceName`: source information
- `isActive`: whether still ongoing
- `createdAt`: creation timestamp

Relationships:
- One disruption event can affect many shipments through `EventShipmentImpact`

### EventShipmentImpact

File: `src/main/java/com/supplychain/model/EventShipmentImpact.java`

Purpose:
Links a `DisruptionEvent` to a `Shipment`.

Important fields:
- `event`: the disruption event
- `shipment`: the affected shipment
- `impactScore`: how strongly the event affects the shipment
- `distanceFromRouteKm`: how far the event is from the route
- `createdAt`: timestamp

Meaning:
This is a join entity with extra data. It is not just a plain many-to-many table.

### HistoricalDelay

File: `src/main/java/com/supplychain/model/HistoricalDelay.java`

Purpose:
Stores historical route delay data for analytics or model training.

Important fields:
- `routeOrigin`, `routeDestination`: route pair
- `carrier`: optional carrier
- `month`: month number
- `avgDelayHours`: average delay
- `delayCount`: count of delayed shipments
- `totalShipments`: total shipments measured
- `delayRate`: derived delay percentage/rate

Meaning:
This helps estimate future delay risk based on history.

## 3. Relationship diagram

Text diagram:

```text
User
  |
  | (separate application user table)
  v
No direct JPA relation to shipment models in current code


Shipment
  |
  | 1 ---- * ShipmentRoute
  |          - each route row belongs to one shipment
  |
  | 1 ---- * RiskPrediction
  |          - one shipment can have many predictions
  |
  | 1 ---- * Alert
  |          - one shipment can have many alerts
  |
  | 1 ---- * EventShipmentImpact * ---- 1 DisruptionEvent
             - connects shipments and events
             - stores extra fields like impactScore and distanceFromRouteKm


HistoricalDelay
  |
  | standalone analytics table
  v
Used for historical delay patterns, not directly linked by JPA relation here
```

Simplified ER-style view:

```text
+------------------+
|      User        |
+------------------+
| id               |
| email            |
| passwordHash     |
| fullName         |
| role             |
| createdAt        |
+------------------+


+------------------+         +----------------------+
|     Shipment     | 1 ----* |    ShipmentRoute     |
+------------------+         +----------------------+
| id               |         | id                   |
| trackingNumber   |         | shipment_id          |
| origin           |         | waypointOrder        |
| destination      |         | city                 |
| carrier          |         | country              |
| transportMode    |         | lat/lng              |
| status           |         | estimatedArrival     |
| ...              |         | actualArrival        |
+------------------+         +----------------------+
         |
         | 1 ----* +----------------------+
         |         |   RiskPrediction     |
         |         +----------------------+
         |         | id                   |
         |         | shipment_id          |
         |         | delayProbability     |
         |         | estimatedDelayHours  |
         |         | primaryCause         |
         |         | llmExplanation       |
         |         | featureSnapshot      |
         |         | modelVersion         |
         |         | predictedAt          |
         |         +----------------------+
         |
         | 1 ----* +----------------------+
         |         |        Alert         |
         |         +----------------------+
         |         | id                   |
         |         | shipment_id          |
         |         | alertType            |
         |         | message              |
         |         | severity             |
         |         | isRead               |
         |         | createdAt            |
         |         +----------------------+
         |
         | 1 ----* +----------------------+
                   |  EventShipmentImpact |
                   +----------------------+
                   | id                   |
                   | shipment_id          |
                   | event_id             |
                   | impactScore          |
                   | distanceFromRouteKm  |
                   | createdAt            |
                   +----------------------+
                              * ---- 1
                         +----------------------+
                         |   DisruptionEvent    |
                         +----------------------+
                         | id                   |
                         | title                |
                         | description          |
                         | eventType            |
                         | severity             |
                         | location             |
                         | lat/lng              |
                         | impactRadiusKm       |
                         | eventDate            |
                         | sourceUrl            |
                         | sourceName           |
                         | isActive             |
                         | createdAt            |
                         +----------------------+


+----------------------+
|   HistoricalDelay    |
+----------------------+
| id                   |
| routeOrigin          |
| routeDestination     |
| carrier              |
| month                |
| avgDelayHours        |
| delayCount           |
| totalShipments       |
| delayRate            |
+----------------------+
```

## 4. Core design idea

The package is centered around `Shipment`.

- `Shipment` is the main business entity.
- `ShipmentRoute` describes where the shipment goes.
- `RiskPrediction` describes predicted delay risk.
- `Alert` stores notifications for users.
- `DisruptionEvent` stores external incidents.
- `EventShipmentImpact` connects incidents to shipments.
- `HistoricalDelay` stores past aggregated delay data.
- `User` stores application login users.

## 5. Interview-style summary

If asked to explain the package briefly:

"This model package uses JPA entities to represent the supply chain domain. `Shipment` is the central entity. A shipment can have route waypoints, alerts, and risk predictions. External disruption events are stored separately and linked to shipments through `EventShipmentImpact`, which also stores impact score details. `HistoricalDelay` keeps route-level historical metrics, and `User` manages application users."
