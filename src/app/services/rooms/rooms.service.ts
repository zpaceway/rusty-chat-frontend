import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../../environments/environment';
import { v4 as uuid4 } from 'uuid';

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
  hasUnponedChats: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RoomsService {
  username = '';
  rooms: Room[] = [];
  selectedRoom: string = '';
  messages: Message[] = [];
  connected = false;

  constructor(private http: HttpClient) {
    this.setUsername(
      localStorage.getItem('username') ||
        `user-${uuid4().replace(/-/g, '')}`.substring(0, 20)
    );
    this.connect();
    const previousRooms = [
      'general',
      ...(JSON.parse(localStorage.getItem('rooms') || '[]') as string[]),
    ];
    previousRooms.forEach((room) => {
      this.addNewRoom(room, room === 'general');
    });
  }

  setUsername(username: string) {
    this.username = username;
    localStorage.setItem('username', this.username);
  }

  setSelectedRoom(room: string) {
    this.selectedRoom = room;
    this.messages =
      this.rooms.find((room) => {
        const isSelected = room.name === this.selectedRoom;
        if (isSelected) {
          room.hasUnponedChats = false;
        }
        return isSelected;
      })?.messages || [];
    this.scrollMessagesContainerToBottom();
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

  addNewRoom(newRoom: string, setSelectedRoom = true) {
    this.rooms = [
      ...this.rooms.filter((room) => room.name != newRoom),
      { name: newRoom, messages: [], hasUnponedChats: false },
    ];
    this.getRoomMessages(newRoom).subscribe((response) => {
      const messages: Message[] = (
        response as RoomMessagesResponse
      ).messages.map((message) => {
        message.created_at = new Date(message.created_at);
        return message;
      });
      const roomObject = this.rooms.find((_room) => _room.name === newRoom);
      if (roomObject) {
        roomObject.messages.length = 0;
        roomObject.messages = messages;
        if (setSelectedRoom) {
          this.setSelectedRoom(newRoom);
        }
      }
      const roomNames = this.rooms.map((room) => room.name);
      localStorage.setItem('rooms', JSON.stringify(roomNames));
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
        if (this.selectedRoom !== room.name) {
          room.hasUnponedChats = true;
        } else {
          this.scrollMessagesContainerToBottom();
        }
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

  scrollMessagesContainerToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('#messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  }
}
