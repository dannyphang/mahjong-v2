import { Component, Input } from '@angular/core';
import { GameService, MahjongDto, PlayerDto, RoomDto } from '../../../core/services/game.service';

@Component({
  selector: 'app-discard-area',
  templateUrl: './discard-area.component.html',
  styleUrl: './discard-area.component.scss'
})
export class DiscardAreaComponent {
  @Input() room: RoomDto;
  discardMapBackground: string;
  woodColor: string;

  constructor(
    private gameService: GameService
  ) {

  }

  ngOnInit() {
    this.discardMapBackground = 'url(../../../../assets/images/room/mahjongTable.jpg)';
    this.woodColor = '#bc6a3c';
  }

  returnIsTaken(mahjong: MahjongDto): boolean {
    return this.gameService.checkMahjongIsTaken(this.room, mahjong.uid);
  }
}
