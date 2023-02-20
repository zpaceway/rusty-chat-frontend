import { Component } from '@angular/core';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { RoomsService } from 'src/app/services/rooms/rooms.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  faPaperPlane = faPaperPlane;
  newMessage = '';

  constructor(public roomsService: RoomsService) {}

  sendMessage() {
    if (this.newMessage.trim()) {
      this.newMessage = this.newMessage.trim();
      this.roomsService.sendMessage(this.newMessage).subscribe(() => {
        this.newMessage = '';
        const messageContentArea = document.querySelector(
          '#message-content-area'
        );
        if (messageContentArea) {
          messageContentArea.innerHTML = '';
        }
      });
    }
  }

  onContentChange($event: Event) {
    this.newMessage = ($event.target as HTMLDivElement).innerText;
  }
}
