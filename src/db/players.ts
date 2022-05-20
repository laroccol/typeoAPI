import { dbClient } from "../../src/config/db";

export const createPlayer = async (uid: string, username: string) => {
  return (
    await dbClient.query(
      `INSERT INTO players (player_uid, username) VALUES ('${uid}', '${username}')`
    )
  ).rowCount;
};

export const createFriendRequest = async (sender: string, receiver: string) => {
  return (
    await dbClient.query(
      `INSERT INTO player_relations (sender_id, receiver_id, status) VALUES ('${sender}', '${receiver}', 'pending')`
    )
  ).rowCount;
};

export const getFriendRequests = async (uid: string) => {
  return (
    await dbClient.query(
      `SELECT sender_id, username FROM player_relations INNER JOIN players ON sender_id = player_uid WHERE receiver_id = '${uid}' AND status = 'pending'`
    )
  ).rows;
};

export const getFriendRequest = async (sender: string, receiver: string) => {
  return (
    await dbClient.query(
      `SELECT * FROM player_relations WHERE sender_id = '${sender}' AND receiver_id = '${receiver}' AND status = 'pending'`
    )
  ).rows;
};

export const deleteFriendRequest = async (sender: string, receiver: string) => {
  return (
    await dbClient.query(
      `DELETE FROM player_relations WHERE sender_id = '${sender}' AND receiver_id = '${receiver}' AND status = 'pending'`
    )
  ).rowCount;
};

export const createFriend = async (sender: string, receiver: string) => {
  return (
    await dbClient.query(
      `UPDATE player_relations SET status = 'friends' WHERE sender_id = '${sender}' AND receiver_id = '${receiver}'`
    )
  ).rowCount;
};

export const getFriendRelations = async (uid: string) => {
  const sender_rows = (
    await dbClient.query(
      `SELECT sender_id as uid, username FROM player_relations INNER JOIN players ON sender_id = player_uid WHERE receiver_id = '${uid}'`
    )
  ).rows;

  const receiver_rows = (
    await dbClient.query(
      `SELECT receiver_id as uid, username FROM player_relations INNER JOIN players ON receiver_id = player_uid WHERE sender_id = '${uid}'`
    )
  ).rows;

  return [...sender_rows, ...receiver_rows];
};
