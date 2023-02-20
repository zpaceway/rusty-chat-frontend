import { ChangeDetectorRef, Component } from '@angular/core';
import { faUser, faBars } from '@fortawesome/free-solid-svg-icons';
import { RoomsService } from 'src/app/services/rooms/rooms.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  faUser = faUser;
  faBars = faBars;
  isOpened = true;

  newRoom = '';

  constructor(
    public roomsService: RoomsService,
    private cdr: ChangeDetectorRef
  ) {}

  addNewRoom() {
    if (this.newRoom.toLowerCase()) {
      this.roomsService.addNewRoom(this.newRoom.toLowerCase());
      this.newRoom = '';
    }
  }

  toggleNavbar() {
    this.isOpened = !this.isOpened;
  }
}
