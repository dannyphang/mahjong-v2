import { Router } from "express";
import express from "express";
const router = Router();
import * as db from "../firebase/firebase-admin.js";
import responseModel from "../shared/function.js";
import * as games from "./game.js";

router.use(express.json());

const mahjongCollectionName = "mahjong";
const combinationCollectionName = "combination";

// create new mahjong
router.post("/", async (req, res) => {
  try {
    const list = JSON.parse(JSON.stringify(req.body));

    if (list.length > 0) {
      list.forEach(async (m, index) => {
        let newRef = db.default.db.collection(mahjongCollectionName).doc();
        m.uid = newRef.id;
        m.statusId = 1;

        await newRef.set(m);

        if (index === list.length - 1) {
          res
            .status(200)
            .json(responseModel({ responseMessage: "Created " + list.length + " record(s)." }));
        }
      });
    } else {
      res.status(200).json(responseModel({ data: list }));
    }
  } catch (error) {
    console.log("error", error);
    res.status(400).json(
      responseModel({
        isSuccess: false,
        responseMessage: error,
      })
    );
  }
});

// get all mahjong
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.default.db
      .collection(mahjongCollectionName)
      .orderBy("order")
      .where("statusId", "==", 1)
      .get();

    const list = snapshot.docs.map((doc) => {
      return doc.data();
    });

    res.status(200).json(responseModel({ data: list }));
  } catch (error) {
    console.log("error", error);
    res.status(400).json(
      responseModel({
        isSuccess: false,
        responseMessage: error,
      })
    );
  }
});

// get room by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const snapshot = await db.default.db.collection(roomCollectionName).doc(id).get();

    const room = snapshot.data().statusId == 1 ? snapshot.data() : {};

    res.status(200).json(responseModel({ data: room }));
  } catch (error) {
    console.log("error", error);
    res.status(400).json(
      responseModel({
        isSuccess: false,
        responseMessage: error,
      })
    );
  }
});

// router.post("/combination", async (req, res) => {
//     try {
//         const list = JSON.parse(JSON.stringify(req.body));

//         list.forEach(async (m, index) => {
//           let newRef = db.default.db.collection(combinationCollectionName).doc();
//           m.uid = newRef.id;
//           m.statusId = 1;

//           await newRef.set(m);

//           if (index === list.length - 1) {
//               res.status(200).json(responseModel({ responseMessage: "Created " + list.length + " record(s)." }));
//           }
//       });
//     } catch (error) {}
// });

router.post("/calculate_points", async (req, res) => {
  try {
    let mahjong = JSON.parse(JSON.stringify(req.body.mahjong));
    games.calculateMahjongSetPoints(mahjong).then((r) => {
      res.status(200).json(responseModel({ data: r }));
    });
  } catch (error) {
    console.log("error", error);
    res.status(400).json(
      responseModel({
        isSuccess: false,
        responseMessage: error,
      })
    );
  }
});

export default router;
