import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const app: express.Application = express();

const port: number = Number(process.env.PORT) || 3001;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let column = "kunta";
let keyword = "";
let kuntaHeader = "mdl-data-table__header--sorted-descending";
let populationHeader = "";
let menHeader = "";
let womenHeader = "";
let direction = "descending";

interface kunta {
  id: number;
  kunta: string;
  asukkaatYhteensa: number;
  asukkaatMiehet: number;
  asukkaatNaiset: number;
}

const sortData = (data: kunta[], column: string) => {
  let sorted: kunta[] = [
    {
      id: 0,
      kunta: "",
      asukkaatYhteensa: 0,
      asukkaatMiehet: 0,
      asukkaatNaiset: 0,
    },
  ];
  if (column === "kunta") {
    kuntaHeader = `mdl-data-table__header--sorted-${direction}`;
    populationHeader = "";
    menHeader = "";
    womenHeader = "";
    if (direction === "descending") {
      sorted = data.sort((a: kunta, b: kunta) => (a.kunta > b.kunta ? 1 : -1));
    } else {
      sorted = data.sort((a: kunta, b: kunta) => (a.kunta < b.kunta ? 1 : -1));
    }
  } else if (column === "asukkaatYhteensa") {
    kuntaHeader = "";
    populationHeader = `mdl-data-table__header--sorted-${direction}`;
    menHeader = "";
    womenHeader = "";
    if (direction === "descending") {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatYhteensa > b.asukkaatYhteensa ? 1 : -1
      );
    } else {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatYhteensa < b.asukkaatYhteensa ? 1 : -1
      );
    }
  } else if (column === "asukkaatMiehet") {
    kuntaHeader = "";
    populationHeader = "";
    menHeader = `mdl-data-table__header--sorted-${direction}`;
    womenHeader = "";
    if (direction === "descending") {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatMiehet > b.asukkaatMiehet ? 1 : -1
      );
    } else {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatMiehet < b.asukkaatMiehet ? 1 : -1
      );
    }
  } else if (column === "asukkaatNaiset") {
    kuntaHeader = "";
    populationHeader = "";
    menHeader = "";
    womenHeader = `mdl-data-table__header--sorted-${direction}`;
    if (direction === "descending") {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatNaiset > b.asukkaatNaiset ? 1 : -1
      );
    } else {
      sorted = data.sort((a: kunta, b: kunta) =>
        a.asukkaatNaiset < b.asukkaatNaiset ? 1 : -1
      );
    }
  }
  return sorted;
};

app.get("/", async (req: express.Request, res: express.Response) => {
  let kuntaAggregate: any;
  let kuntaAggregateWomen: any;
  let kuntaCount: number;
  let sortedData: kunta[];

  if (String(req.query.column) === column) {
    if (direction === "descending") {
      direction = "ascending";
    } else {
      direction = "descending";
    }
  } else {
    direction = "descending";
  }
  column = String(req.query.column || column);
  if (keyword === "") {
    let data = await prisma.kunta.findMany();
    sortedData = sortData(data, String(column));

    kuntaCount = await prisma.kunta.count({});
    kuntaAggregate = await prisma.kunta.aggregate({
      _avg: { asukkaatYhteensa: true },
      _sum: { asukkaatYhteensa: true },
    });
    kuntaAggregateWomen = await prisma.kunta.aggregate({
      _sum: { asukkaatNaiset: true },
    });
  } else {
    let data = await prisma.kunta.findMany({
      where: { kunta: { startsWith: String(keyword) } },
    });

    sortedData = sortData(data, String(column));

    kuntaCount = await prisma.kunta.count({
      where: { kunta: { startsWith: String(keyword) } },
    });
    kuntaAggregate = await prisma.kunta.aggregate({
      _avg: { asukkaatYhteensa: true },
      _sum: { asukkaatYhteensa: true },
      where: { kunta: { startsWith: String(keyword) } },
    });
    kuntaAggregateWomen = await prisma.kunta.aggregate({
      _sum: { asukkaatNaiset: true },
      where: { kunta: { startsWith: String(keyword) } },
    });
  }
  let womenPopulationPercent: Number = -1;
  if (
    kuntaAggregateWomen._sum.asukkaatNaiset &&
    kuntaAggregate._sum.asukkaatYhteensa
  ) {
    womenPopulationPercent =
      kuntaAggregateWomen._sum.asukkaatNaiset /
      kuntaAggregate._sum.asukkaatYhteensa;
  }

  res.render("index", {
    data: sortedData,
    kuntaCount: kuntaCount,
    populationAvg: kuntaAggregate._avg.asukkaatYhteensa,
    womenPopulationPercent: womenPopulationPercent,
    column: column,
    kuntaHeader: kuntaHeader,
    populationHeader: populationHeader,
    menHeader: menHeader,
    womenHeader: womenHeader,
  });
});

app.post("/", async (req: express.Request, res: express.Response) => {
  keyword = String(req.body.keyword || "");
  let data = await prisma.kunta.findMany({
    where: { kunta: { startsWith: String(req.body.keyword) } },
  });
  column = String(req.query.column || column);

  let sortedData = sortData(data, String(column));

  let kuntaCount = await prisma.kunta.count({
    where: { kunta: { startsWith: String(req.body.keyword) } },
  });
  let kuntaAggregate = await prisma.kunta.aggregate({
    _avg: { asukkaatYhteensa: true },
    _sum: { asukkaatYhteensa: true },
    where: { kunta: { startsWith: String(req.body.keyword) } },
  });
  let kuntaAggregateWomen = await prisma.kunta.aggregate({
    _sum: { asukkaatNaiset: true },
    where: { kunta: { startsWith: String(req.body.keyword) } },
  });
  let womenPopulationPercent: Number = -1;
  if (
    kuntaAggregateWomen._sum.asukkaatNaiset &&
    kuntaAggregate._sum.asukkaatYhteensa
  ) {
    womenPopulationPercent =
      kuntaAggregateWomen._sum.asukkaatNaiset /
      kuntaAggregate._sum.asukkaatYhteensa;
  }
  res.render("index", {
    data: sortedData,
    kuntaCount: kuntaCount,
    populationAvg: kuntaAggregate._avg.asukkaatYhteensa,
    populationSum: kuntaAggregate._sum.asukkaatYhteensa,
    womenPopulationPercent: womenPopulationPercent,
    column: column,
    kuntaHeader: kuntaHeader,
    populationHeader: populationHeader,
    menHeader: menHeader,
    womenHeader: womenHeader,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
