declare namespace Express {
  export interface Request {
    currentUser?: string;
  }
}

declare namespace SocketIO {
  export interface Socket {
    "current-user-d"?: string;
  }
}
