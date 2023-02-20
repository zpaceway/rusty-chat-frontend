import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from './../../../environments/environment';

interface RoomMessagesResponse {
  room: string;
  messages: Message[];
}
interface Message {
  sender: string;
  content: string;
  created_at: Date;
  room: string;
}

interface Room {
  name: string;
  messages: Message[];
}

@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  username = 'guest';
  rooms: Room[] = [];
  selectedRoom: string = '';
  messages: Message[] = [];
  connected = false;

  constructor(private http: HttpClient) {
    this.connect();
    this.addNewRoom('general');
  }

  setSelectedRoom(room: string) {
    this.selectedRoom = room;
    this.messages =
      this.rooms.find((room) => room.name === this.selectedRoom)?.messages ||
      [];
  }

  getRoomMessages(room: string) {
    return this.http.get(`${environment.backendUrl}/messages`, {
      params: {
        room,
      },
    });
  }

  sendMessage(content: string) {
    return this.http.post(`${environment.backendUrl}/message`, {
      room: this.selectedRoom,
      sender: this.username,
      content,
      created_at: new Date(),
    });
  }

  addNewRoom(newRoom: string) {
    this.rooms = [
      ...this.rooms.filter((room) => room.name != newRoom),
      { name: newRoom, messages: [] },
    ];
    this.getRoomMessages(newRoom).subscribe((response) => {
      const { messages } = response as RoomMessagesResponse;
      const roomObject = this.rooms.find((_room) => _room.name === newRoom);
      if (roomObject) {
        roomObject.messages.length = 0;
        roomObject.messages = messages;
        this.setSelectedRoom(newRoom);
      }
    });
  }

  connect() {
    const events = new EventSource(`${environment.backendUrl}/events`);

    events.addEventListener('open', () => (this.connected = true));

    events.addEventListener('message', (event) => {
      const data = JSON.parse(event.data) as Message;
      const room = this.rooms.find((room) => room.name === data.room);
      if (room) {
        room.messages.push({
          sender: data.sender,
          created_at: new Date(data.created_at),
          content: data.content,
          room: this.selectedRoom,
        });
      }
    });

    events.addEventListener('error', () => {
      if (this.connected) {
        this.connected = false;
      }
      setTimeout(() => {
        this.connect();
      }, 2000);
    });
  }
}
