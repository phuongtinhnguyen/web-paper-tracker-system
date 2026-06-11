const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes/index.routes");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// helmet giúp tăng bảo mật HTTP bằng cách tự thêm một số response headers an toàn.
app.use(helmet());
app.use(cors());
app.use(express.json());
// morgan dùng để log request ra terminal khi Backend chạy.
app.use(morgan("dev"));

app.use("/api/v1", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
