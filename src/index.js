const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const redis = require("redis");
const bodyParser = require("body-parser");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const SIMULATION_DATA_QUEUE_LABEL = "queue:simulation-data";
const SIMULATION_RESULT_QUEUE_LABEL = "queue:simulation-result";

const redisClient = redis.createClient();
redisClient.on("error", (err) => console.log(err));

const getAllSimulations = () => {
  return new Promise((resolve, reject) =>
    redisClient.lrange(SIMULATION_DATA_QUEUE_LABEL, 0, -1, (err, queue) =>
      resolve(JSON.parse(queue))
    )
  );
};

const getAllSimulationsResults = () => {
  return new Promise((resolve, reject) =>
    redisClient.lrange(SIMULATION_RESULT_QUEUE_LABEL, 0, -1, (err, queue) =>
      resolve(JSON.parse(queue))
    )
  );
};

app.get("/api/simulationQueueConnected", (req, res) =>
  res.json(redisClient.connected)
);

app.get("/api/simulationsQueue", (req, res) =>
  getAllSimulations().then((queue) => res.json(queue))
);

app.get("/api/simulationsResultsQueue", (req, res) =>
  getAllSimulationsResults().then((queue) => res.json(queue))
);

app.delete("/api/deleteAllSimulations", (req, res) => {
  redisClient.del(SIMULATION_DATA_QUEUE_LABEL, () =>
    getAllSimulations().then((queue) => res.json(queue))
  );
});

app.delete("/api/deleteAllSimulationsResults", (req, res) => {
  redisClient.del(SIMULATION_RESULT_QUEUE_LABEL, () =>
    getAllSimulationsResults().then((queue) => res.json(queue))
  );
});

app.post("/api/pushSimulation", (req, res) => {
  console.log(req.body);
  redisClient.lpush(SIMULATION_DATA_QUEUE_LABEL, JSON.stringify(req.body), () =>
    getAllSimulations().then((queue) => res.json(queue))
  );
});

app.listen(port, () => console.log(`Server listening on port ${port}!`));
