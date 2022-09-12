import express from "express";

const app: express.Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req: express.Request, res: express.Response) => {
  res.render("index", {
    data: "upload done",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
