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

const POPULATION_QUEUE_LABEL = "queue:population";

const redisClient = redis.createClient();
redisClient.on("error", (err) => console.log(err));

const getAllFromQueue = (label) =>  new Promise((resolve, reject) =>
  redisClient.lrange(label, 0, -1, (err, queue) => {
    resolve(queue.map(JSON.parse))
  })
);

const getAllSimulations = () => {
  return getAllFromQueue(SIMULATION_DATA_QUEUE_LABEL)
};

const getAllSimulationsResults = () => {
  return getAllFromQueue(SIMULATION_RESULT_QUEUE_LABEL)
};

const getAllPopulations = () => getAllFromQueue(POPULATION_QUEUE_LABEL)

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

app.delete("/api/deleteAllSimulationResults", (req, res) => {
  redisClient.del(SIMULATION_RESULT_QUEUE_LABEL, () =>
    getAllSimulationsResults().then((queue) => res.json(queue))
  );
});

app.post("/api/pushSimulation", (req, res) => {
  redisClient.lpush(SIMULATION_DATA_QUEUE_LABEL, JSON.stringify(req.body), () =>
    getAllSimulations().then((queue) => res.json(queue))
  );
});


app.get("/api/populations", (req, res) =>
  getAllPopulations().then((queue) => {
    res.json(queue)
  })
);

app.listen(port, () => console.log(`Server listening on port ${port}!`));
