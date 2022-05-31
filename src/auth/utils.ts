import admin, { auth } from "firebase-admin";

export const verifyUID = async (uid: string): Promise<boolean> => {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch {
    return false;
  }
};

export const getUsernameFromUID = async (uid: string): Promise<string> => {
  try {
    return (await admin.auth().getUser(uid)).displayName;
  } catch (err) {
    return null;
  }
};

export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    await admin.auth().deleteUser(uid);
    return true;
  } catch (err) {
    return false;
  }
};
