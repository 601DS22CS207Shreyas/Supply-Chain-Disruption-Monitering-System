# Supply Chain Backend Repository Notes

These notes explain the files in the `repository` package in detail.

The repository layer is the data-access layer of the application. It is responsible for reading data from the database, writing data to the database, and exposing query methods that services and controllers can call.

## 1. What a repository is

In Spring Boot with Spring Data JPA, a repository is usually an interface.

Example pattern:

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

You write the interface, and Spring generates the implementation at runtime.

That means you do not need to manually write SQL for basic operations like:

- save an entity
- find by ID
- delete by ID
- find all rows

Spring Data JPA creates those automatically because the interface extends `JpaRepository`.

## 2. Core concepts used in these files

### `JpaRepository<Entity, IdType>`

This is the base Spring Data JPA repository interface.

Example:

```java
JpaRepository<Shipment, Long>
```

Meaning:
- this repository manages the `Shipment` entity
- the primary key type of `Shipment` is `Long`

By extending `JpaRepository`, each repository gets many built-in methods such as:

- `save(entity)`
- `saveAll(list)`
- `findById(id)`
- `findAll()`
- `deleteById(id)`
- `count()`
- `existsById(id)`

### Derived query methods

Spring Data JPA can generate queries from method names.

Example:

```java
Optional<User> findByEmail(String email);
```

Spring reads the method name:
- `findBy` means fetch one or more records by condition
- `Email` refers to the `email` field in the entity

So Spring automatically creates the query.

Another example:

```java
List<ShipmentRoute> findByShipmentIdOrderByWaypointOrder(Long shipmentId);
```

This means:
- find rows where `shipment.id = ?`
- return them ordered by `waypointOrder`

### `@Query`

When method names become too complex, you can write JPQL manually.

Example:

```java
@Query("SELECT h FROM HistoricalDelay h WHERE h.routeOrigin = :origin")
```

This tells Spring exactly what query to run.

Important:
- this is usually JPQL, not raw SQL
- JPQL uses entity names and field names, not table names and column names

So:
- `HistoricalDelay` is the entity class
- `routeOrigin` is the Java field
- not the table name `historical_delays`

### `@Param`

Used with `@Query` to bind method parameters to query variables.

Example:

```java
@Param("origin") String origin
```

This maps the Java method parameter to `:origin` inside the query.

### `Optional<T>`

Used when a result may or may not exist.

Example:

```java
Optional<User> findByEmail(String email);
```

Meaning:
- if a user exists, return it
- if not, return an empty `Optional`

This is safer than returning `null`.

### `List<T>`

Used when multiple rows are expected.

Example:

```java
List<Alert> findByShipmentIdOrderByCreatedAtDesc(Long shipmentId);
```

### `Page<T>` and `Pageable`

Used for pagination.

Example:

```java
Page<Shipment> findByStatus(ShipmentStatus status, Pageable pageable);
```

Meaning:
- return one page of results
- `Pageable` contains page number, page size, sort info

Why use this:
- avoids loading too much data at once
- useful for dashboard tables and APIs

`Page<T>` usually contains:
- current page content
- total element count
- total pages
- current page number

### `boolean` query methods

Example:

```java
boolean existsByEmail(String email);
```

This checks whether at least one row matches.

Useful for:
- validation
- duplicate prevention

### `long` count methods

Example:

```java
long countByStatus(ShipmentStatus status);
```

This counts rows matching a condition.

Useful for:
- KPIs
- dashboard statistics

## 3. Package overview

The repository package contains:

- `UserRepository`
- `ShipmentRepository`
- `ShipmentRouteRepository`
- `RiskPredictionRepository`
- `AlertRepository`
- `DisruptionEventRepository`
- `EventShipmentImpactRepository`
- `HistoricalDelayRepository`

Each repository corresponds to one model/entity class.

## 4. File-by-file explanation

## `UserRepository`

File: `src/main/java/com/supplychain/repository/UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
```

Purpose:
Handles database access for `User`.

### `findByEmail(String email)`

What it does:
- finds a user whose `email` field matches the given email

Why `Optional<User>` is used:
- a user with that email may not exist

Typical use:
- login
- user lookup
- registration validation

### `existsByEmail(String email)`

What it does:
- checks whether a user with that email already exists

Typical use:
- prevent duplicate registration

## `ShipmentRepository`

File: `src/main/java/com/supplychain/repository/ShipmentRepository.java`

```java
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
```

Purpose:
Handles all shipment-related queries.

### `findByTrackingNumber(String trackingNumber)`

```java
Optional<Shipment> findByTrackingNumber(String trackingNumber);
```

What it does:
- returns the shipment with the given tracking number

Why useful:
- tracking numbers are business identifiers
- users often search by tracking ID instead of database ID

### `findByStatus(ShipmentStatus status, Pageable pageable)`

```java
Page<Shipment> findByStatus(ShipmentStatus status, Pageable pageable);
```

What it does:
- returns shipments with a particular status
- paginated

Example statuses:
- `PENDING`
- `IN_TRANSIT`
- `DELIVERED`

Why use `Pageable`:
- dashboards usually show shipments page by page

### `findByTransportMode(TransportMode mode, Pageable pageable)`

```java
Page<Shipment> findByTransportMode(TransportMode mode, Pageable pageable);
```

What it does:
- filters shipments by transport mode such as road, air, sea

### `searchShipments(@Param("q") String query, Pageable pageable)`

```java
@Query("""
    SELECT s FROM Shipment s
    WHERE LOWER(s.origin) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(s.destination) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(s.carrier) LIKE LOWER(CONCAT('%', :q, '%'))
       OR LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :q, '%'))
    """)
Page<Shipment> searchShipments(@Param("q") String query, Pageable pageable);
```

What it does:
- performs free-text search across:
  - origin
  - destination
  - carrier
  - tracking number

Important concepts:
- `LOWER(...)` makes search case-insensitive
- `LIKE` with `%` performs partial matching
- `CONCAT('%', :q, '%')` means "contains the search text anywhere"

Example:
- if `q = "mum"`
- it can match `Mumbai`

Why `@Query` is used:
- the method is too complex to express cleanly with a derived method name

### `findByStatusIn(List<ShipmentStatus> statuses)`

```java
List<Shipment> findByStatusIn(List<ShipmentStatus> statuses);
```

What it does:
- returns shipments whose status is inside a given list

Equivalent idea:
- SQL `WHERE status IN (...)`

Typical use:
- fetch only active shipments for prediction jobs

### `countByStatus(ShipmentStatus status)`

```java
long countByStatus(ShipmentStatus status);
```

What it does:
- counts how many shipments are currently in a given status

Typical use:
- dashboard KPIs

### `findActiveShipmentsNearLocation(...)`

```java
@Query("""
    SELECT s FROM Shipment s
    WHERE s.originLat BETWEEN :minLat AND :maxLat
      AND s.originLng BETWEEN :minLng AND :maxLng
      AND s.status IN ('PENDING', 'IN_TRANSIT', 'AT_WAREHOUSE')
    """)
List<Shipment> findActiveShipmentsNearLocation(
        @Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
        @Param("minLng") Double minLng, @Param("maxLng") Double maxLng
);
```

What it does:
- finds active shipments whose origin coordinates fall inside a latitude/longitude box

How it works:
- `BETWEEN` checks whether the coordinates fall inside a numeric range
- this is a simple bounding-box approach, not an exact geospatial radius calculation

Why used:
- quickly identify shipments near some geographic event or area

Important note:
- this query checks shipment origin coordinates only
- it does not inspect route waypoints in this repository method

## `ShipmentRouteRepository`

File: `src/main/java/com/supplychain/repository/ShipmentRouteRepository.java`

```java
public interface ShipmentRouteRepository extends JpaRepository<ShipmentRoute, Long> {

    List<ShipmentRoute> findByShipmentIdOrderByWaypointOrder(Long shipmentId);
}
```

Purpose:
Handles route waypoint records.

### `findByShipmentIdOrderByWaypointOrder(Long shipmentId)`

What it does:
- returns all route waypoints for one shipment
- sorted by `waypointOrder`

Why sorting matters:
- route waypoints must appear in travel order

Example result:
- Chennai -> Bengaluru -> Mumbai

## `RiskPredictionRepository`

File: `src/main/java/com/supplychain/repository/RiskPredictionRepository.java`

Purpose:
Handles ML prediction history and summary queries.

### `findTopByShipmentIdOrderByPredictedAtDesc(Long shipmentId)`

```java
Optional<RiskPrediction> findTopByShipmentIdOrderByPredictedAtDesc(Long shipmentId);
```

What it does:
- returns the most recent prediction for a shipment

How the name works:
- `findTopBy` means return the first row after sorting
- `OrderByPredictedAtDesc` means latest timestamp first

Typical use:
- show the latest risk score on a shipment details page

### `findByShipmentIdOrderByPredictedAtAsc(Long shipmentId)`

```java
List<RiskPrediction> findByShipmentIdOrderByPredictedAtAsc(Long shipmentId);
```

What it does:
- returns all predictions for one shipment
- sorted oldest to newest

Typical use:
- risk trend chart

### `findLatestHighRiskPredictions(double threshold)`

```java
@Query("SELECT rp FROM RiskPrediction rp WHERE rp.delayProbability >= :threshold " +
        "AND rp.predictedAt = (SELECT MAX(rp2.predictedAt) FROM RiskPrediction rp2 WHERE rp2.shipment = rp.shipment)")
List<RiskPrediction> findLatestHighRiskPredictions(double threshold);
```

What it does:
- returns only the latest prediction for each shipment
- filters to predictions whose `delayProbability` is above the threshold

Why the subquery is needed:
- each shipment may have many predictions
- the query first identifies the maximum `predictedAt` for each shipment
- then keeps only that latest row

Why this matters:
- dashboard should not show old predictions as current risk

### `findAverageRiskScore()`

```java
@Query("SELECT AVG(rp.delayProbability) FROM RiskPrediction rp " +
        "WHERE rp.predictedAt = (SELECT MAX(rp2.predictedAt) FROM RiskPrediction rp2 WHERE rp2.shipment = rp.shipment)")
Double findAverageRiskScore();
```

What it does:
- calculates the average delay probability across the latest prediction of each shipment

Why not average all prediction rows:
- old predictions would distort the current dashboard view

Return type:
- `Double`
- may be `null` if no rows exist

## `AlertRepository`

File: `src/main/java/com/supplychain/repository/AlertRepository.java`

Purpose:
Handles notification records.

### `findByIsReadFalseOrderByCreatedAtDesc(Pageable pageable)`

```java
Page<Alert> findByIsReadFalseOrderByCreatedAtDesc(Pageable pageable);
```

What it does:
- returns unread alerts only
- newest first
- paginated

How method naming works:
- `findByIsReadFalse` means filter where `isRead = false`
- `OrderByCreatedAtDesc` sorts from newest to oldest

Typical use:
- notification center

### `findAllByOrderByCreatedAtDesc(Pageable pageable)`

```java
Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);
```

What it does:
- returns all alerts
- newest first
- paginated

### `findByShipmentIdOrderByCreatedAtDesc(Long shipmentId)`

```java
List<Alert> findByShipmentIdOrderByCreatedAtDesc(Long shipmentId);
```

What it does:
- returns alerts for one shipment
- sorted by latest first

Typical use:
- shipment detail page with alert history

### `countByIsReadFalse()`

```java
long countByIsReadFalse();
```

What it does:
- counts unread alerts

Typical use:
- notification badge count

## `DisruptionEventRepository`

File: `src/main/java/com/supplychain/repository/DisruptionEventRepository.java`

Purpose:
Handles queries related to real-world disruption events.

### `findByEventType(EventType eventType, Pageable pageable)`

```java
Page<DisruptionEvent> findByEventType(EventType eventType, Pageable pageable);
```

What it does:
- returns events of a specific type

Examples:
- strike
- flood
- port closure

### `findBySeverity(EventSeverity severity, Pageable pageable)`

```java
Page<DisruptionEvent> findBySeverity(EventSeverity severity, Pageable pageable);
```

What it does:
- filters events by severity level

### `findByIsActiveTrue()`

```java
List<DisruptionEvent> findByIsActiveTrue();
```

What it does:
- returns only active or ongoing events

### `existsBySourceUrl(String sourceUrl)`

```java
boolean existsBySourceUrl(String sourceUrl);
```

What it does:
- checks whether an event from the same source URL already exists

Why useful:
- prevents duplicate ingestion from news feeds

### `findByEventDateBetween(LocalDate from, LocalDate to)`

```java
List<DisruptionEvent> findByEventDateBetween(LocalDate from, LocalDate to);
```

What it does:
- returns events whose `eventDate` falls between two dates

Typical use:
- dashboard filters
- weekly or monthly reporting

### `findActiveEventsNearLocation(...)`

```java
@Query("""
    SELECT e FROM DisruptionEvent e
    WHERE e.lat BETWEEN :minLat AND :maxLat
      AND e.lng BETWEEN :minLng AND :maxLng
      AND e.isActive = true
    """)
List<DisruptionEvent> findActiveEventsNearLocation(
        @Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
        @Param("minLng") Double minLng, @Param("maxLng") Double maxLng
);
```

What it does:
- returns active events within a coordinate box

Why this exists:
- allows simple geographic filtering without advanced GIS features

### `countBySeverity(EventSeverity severity)`

```java
long countBySeverity(EventSeverity severity);
```

What it does:
- counts events of a given severity

Typical use:
- KPI cards like "High Severity Events"

## `EventShipmentImpactRepository`

File: `src/main/java/com/supplychain/repository/EventShipmentImpactRepository.java`

Purpose:
Handles the join records between events and shipments.

### `findByShipmentId(Long shipmentId)`

```java
List<EventShipmentImpact> findByShipmentId(Long shipmentId);
```

What it does:
- returns all event-impact links for one shipment

Typical use:
- show which events are affecting a shipment

### `findByEventId(Long eventId)`

```java
List<EventShipmentImpact> findByEventId(Long eventId);
```

What it does:
- returns all impacted shipments for one event

Typical use:
- event details page

### `existsByEventIdAndShipmentId(Long eventId, Long shipmentId)`

```java
boolean existsByEventIdAndShipmentId(Long eventId, Long shipmentId);
```

What it does:
- checks whether a shipment-event link already exists

Why useful:
- avoids duplicate association records

## `HistoricalDelayRepository`

File: `src/main/java/com/supplychain/repository/HistoricalDelayRepository.java`

Purpose:
Handles historical route delay analytics data.

### `findByRouteOriginAndRouteDestinationAndCarrierAndMonth(...)`

```java
Optional<HistoricalDelay> findByRouteOriginAndRouteDestinationAndCarrierAndMonth(
        String origin, String destination, String carrier, Integer month
);
```

What it does:
- searches for one exact historical record matching:
  - origin
  - destination
  - carrier
  - month

Why `Optional`:
- that exact combination may not exist

Typical use:
- load historical features for prediction logic

### `findByRouteOrderByMonth(...)`

```java
@Query("SELECT h FROM HistoricalDelay h WHERE h.routeOrigin = :origin AND h.routeDestination = :dest ORDER BY h.month")
List<HistoricalDelay> findByRouteOrderByMonth(
        @Param("origin") String origin,
        @Param("dest") String destination
);
```

What it does:
- returns all historical monthly rows for one route
- sorted by month ascending

Typical use:
- delay trends chart

Why `@Query` is used:
- the developer wanted a clear custom query with ordering

## 5. Relationship between repositories and models

Each repository maps to one entity:

```text
UserRepository                -> User
ShipmentRepository            -> Shipment
ShipmentRouteRepository       -> ShipmentRoute
RiskPredictionRepository      -> RiskPrediction
AlertRepository               -> Alert
DisruptionEventRepository     -> DisruptionEvent
EventShipmentImpactRepository -> EventShipmentImpact
HistoricalDelayRepository     -> HistoricalDelay
```

## 6. Repository flow diagram

The repositories sit between the service layer and the database.

```text
Controller / API Layer
         |
         v
     Service Layer
         |
         v
   Repository Layer
         |
         v
      Database
```

More specifically in this project:

```text
Shipment-related screens/services
         |
         +---- ShipmentRepository
         +---- ShipmentRouteRepository
         +---- RiskPredictionRepository
         +---- AlertRepository
         +---- EventShipmentImpactRepository
         |
         v
      Shipment domain data

Event ingestion / event analysis
         |
         +---- DisruptionEventRepository
         +---- EventShipmentImpactRepository
         |
         v
      Event domain data

Analytics / ML support
         |
         +---- HistoricalDelayRepository
         +---- RiskPredictionRepository
         |
         v
      Trend and prediction data

Authentication / user management
         |
         +---- UserRepository
         |
         v
      User data
```

## 7. How Spring generates these queries

For derived methods, Spring parses the method names.

Examples:

```java
findByEmail
findByStatus
findByShipmentIdOrderByWaypointOrder
countByIsReadFalse
existsByEventIdAndShipmentId
```

Spring breaks them into parts:

- `findBy`, `countBy`, `existsBy`
- field names like `Email`, `Status`, `ShipmentId`
- clauses like `OrderBy...Desc`
- keywords like `In`, `Between`, `True`, `False`

So a method name is almost like a mini query language.

## 8. Common keywords used here

- `findBy`: fetch matching rows
- `existsBy`: return true/false
- `countBy`: count matching rows
- `OrderBy`: sort results
- `Desc`: descending sort
- `Asc`: ascending sort
- `In`: SQL-style `IN (...)`
- `Between`: range query
- `True` / `False`: boolean comparison
- `TopBy`: fetch first row after ordering

## 9. Important design observations

### Good parts

- The repositories are focused and easy to read.
- Most query methods are named clearly.
- Pagination is used where it makes sense.
- `Optional` is used for nullable single-result queries.
- Custom `@Query` is used only where needed.

### Things to understand carefully

- Bounding-box location queries are approximate, not exact geospatial distance calculations.
- `findAverageRiskScore()` can return `null` if the table has no matching rows.
- Queries using latest predictions depend on `predictedAt` ordering being correct.
- Repository methods do not contain business logic; they only fetch/store data.

## 10. Interview-style summary

If asked to explain this repository package briefly:

"This package uses Spring Data JPA repositories to access the database for each entity in the system. By extending `JpaRepository`, each interface gets CRUD operations automatically. Additional methods use Spring Data derived query naming for common filters like `findByStatus`, `existsByEmail`, and `countByIsReadFalse`. More complex cases use `@Query` with JPQL and `@Param`, such as free-text shipment search, latest high-risk prediction selection, and geographic bounding-box event lookup. Pagination is handled with `Page` and `Pageable` for dashboard-friendly queries."

## 11. Quick revision sheet

- `JpaRepository<Entity, Long>` = CRUD + paging + sorting support
- Derived query methods = query from method name
- `@Query` = custom JPQL query
- `@Param` = binds method argument to query variable
- `Optional<T>` = maybe one row
- `List<T>` = many rows
- `Page<T>` = paginated result
- `Pageable` = page number + size + sort
- `existsBy...` = duplicate check
- `countBy...` = KPI/statistics query
