CREATE GRAPH SetuGraph()

USE GRAPH SetuGraph

CREATE VERTEX Warehouse (
  PRIMARY_ID id STRING,
  name STRING,
  lat FLOAT,
  lng FLOAT,
  capacity INT,
  operational BOOL,
  stock_medicine INT,
  stock_food INT,
  stock_blanket INT
) WITH primary_id_as_attribute="true"

CREATE VERTEX Village (
  PRIMARY_ID id STRING,
  name STRING,
  lat FLOAT,
  lng FLOAT,
  pop INT,
  urgencylevel FLOAT,
  request_type STRING,
  wait_time FLOAT
) WITH primary_id_as_attribute="true"

CREATE VERTEX Supplier (
  PRIMARY_ID id STRING,
  name STRING
) WITH primary_id_as_attribute="true"

CREATE DIRECTED EDGE ROADCONNECTS (
  FROM Warehouse | Village,
  TO Village | Warehouse,
  cost FLOAT,
  dist FLOAT,
  time FLOAT,
  isblocked BOOL
)

CREATE DIRECTED EDGE AIRCONNECTS (
  FROM Warehouse | Village,
  TO Village | Warehouse,
  cost FLOAT,
  dist FLOAT,
  time FLOAT,
  isblocked BOOL
)

CREATE DIRECTED EDGE SUPPLIES (
  FROM Supplier,
  TO Warehouse,
  cost FLOAT,
  dist FLOAT,
  time FLOAT,
  isblocked BOOL
)

CREATE LOADING JOB load_setu FOR GRAPH SetuGraph {
  DEFINE FILENAME warehouseFile;
  DEFINE FILENAME villageFile;
  DEFINE FILENAME supplierFile;
  DEFINE FILENAME roadFile;
  DEFINE FILENAME airFile;
  DEFINE FILENAME supplyFile;

  LOAD warehouseFile TO VERTEX Warehouse VALUES(
    $0, $1, to_float($2), to_float($3), to_int($4), to_bool($5), to_int($6), to_int($7), to_int($8)
  ) USING header="true", separator=",";

  LOAD villageFile TO VERTEX Village VALUES(
    $0, $1, to_float($2), to_float($3), to_int($4), to_float($5), $6, to_float($7)
  ) USING header="true", separator=",";

  LOAD supplierFile TO VERTEX Supplier VALUES($0, $1)
    USING header="true", separator=",";

  LOAD roadFile TO EDGE ROADCONNECTS VALUES(
    $0, $1, to_float($2), to_float($3), to_float($4), to_bool($5)
  ) USING header="true", separator=",";

  LOAD airFile TO EDGE AIRCONNECTS VALUES(
    $0, $1, to_float($2), to_float($3), to_float($4), to_bool($5)
  ) USING header="true", separator=",";

  LOAD supplyFile TO EDGE SUPPLIES VALUES(
    $0, $1, to_float($2), to_float($3), to_float($4), to_bool($5)
  ) USING header="true", separator=",";
}

RUN GLOBAL SCHEMA_CHANGE JOB
