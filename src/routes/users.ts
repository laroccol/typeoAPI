import express from "express";
import { verifyUID, deleteUser } from "../auth/utils";
import { createUser } from "../db/users";
const router = express.Router();

router.post("/user-create", async (req: any, res, next) => {
  const { uid } = req["current-user"];
  const username = req.body.username;
  const regex = /^[a-zA-Z0-9_.-]*$/;

  try {
    if (regex.test(username)) {
      await createUser(uid, username);
    } else {
      deleteUser(uid);
      const error: R_ERROR = { status: 400, text: "Invalid Username" };
      throw error;
    }
  } catch (err) {
    return next(err);
  }

  res.status(200).send("Successfully Created User");
});

// router.post("/friend_request", async (req: any, res, next) => {
//   const { uid } = req["current-user"];
//   const receiving_id = req.body.uid;

//   try {
//     if (
//       receiving_id &&
//       (await verifyUID(receiving_id)) &&
//       receiving_id !== uid &&
//       (await getFriendRequest(receiving_id, uid)).length <= 0
//     ) {
//       await createFriendRequest(uid, receiving_id);
//     } else {
//       const error: R_ERROR = {
//         status: 400,
//         text: "The Specified User Is Invalid",
//       };
//       throw error;
//     }
//   } catch (err) {
//     return next(err);
//   }

//   res.status(200).send("Friend Request Sent");
// });

// router.get("/friend_requests", async (req: any, res, next) => {
//   const { uid } = req["current-user"];

//   let friend_requests;

//   try {
//     friend_requests = await getFriendRequests(uid);
//   } catch (err) {
//     return next(err);
//   }

//   res.status(200).json(friend_requests);
// });

// router.post("/accept_request", async (req: any, res, next) => {
//   const { uid } = req["current-user"];
//   const player_uid = req.body.uid;

//   try {
//     if (!player_uid || (await createFriend(player_uid, uid)) < 1) {
//       const error: R_ERROR = {
//         status: 400,
//         text: "Invalid User",
//       };
//       throw error;
//     }
//   } catch (err) {
//     return next(err);
//   }

//   res.status(200).send("Accepted Friend Request");
// });

// router.post("/decline_request", async (req: any, res, next) => {
//   const { uid } = req["current-user"];
//   const player_uid = req.body.uid;

//   try {
//     if (!player_uid || (await deleteFriendRequest(player_uid, uid)) < 1) {
//       const error: R_ERROR = {
//         status: 400,
//         text: "Invalid User",
//       };
//       throw error;
//     }
//   } catch (err) {
//     return next(err);
//   }

//   res.status(200).send("Declined Friend Request");
// });

// router.get("/friends", async (req: any, res, next) => {
//   const { uid } = req["current-user"];
//   console.log(uid);

//   let friends;

//   try {
//     console.log(await getFriendRelations(uid));
//     friends = (await getFriendRelations(uid)).map((relation) => ({
//       uid: relation.uid,
//       username: relation.username,
//     }));
//   } catch (err) {
//     return next(err);
//   }

//   res.status(200).json(friends);
// });

export default router;
