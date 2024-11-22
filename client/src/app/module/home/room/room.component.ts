import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketioService } from '../../../core/services/socketIo.service';
import { GameService, MahjongDto, PlayerDto, RoomDto } from '../../../core/services/game.service';
import { MessageService } from 'primeng/api';
import { BaseCoreAbstract } from '../../../core/shared/base/base-core.abstract';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent extends BaseCoreAbstract {
  roomId: string;
  role = 'operative';
  room: RoomDto;
  player: PlayerDto;

  constructor(
    private socketIoService: SocketioService,
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    protected override messageService: MessageService
  ) {
    super(messageService);

    if (this.socketIoService.currentPlayer) {
      this.initRoom();
    }
    else {
      this.router.navigate(["/"]);

    }
  }

  ngOnInit(): void {
  }

  @HostListener('window:beforeunload')
  ngOnDestroy() {
    if (this.player) {
      this.playerQuited(this.player);
      this.socketIoService.disconnectSocket();
    }
  }

  @HostListener("window:keydown", ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Q':
        this.startGame();
        break;
      case 'ArrowRight':
        this.nextTurn();
        break;
      case '1':
        this.sortMahjongList(this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '2':
        this.drawMahjong(this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '3':
        this.discardMahjong(this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '4':
        this.actionMahjong('pong', this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '5':
        this.actionMahjong('kong', this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '6':
        this.actionMahjong('chow', this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
      case '7':
        this.actionMahjong('win', this.room.playerList.find(p => p.playerId === this.player.playerId)!);
        break;
    }
  }

  playerQuited(player: PlayerDto) {
    this.room.playerList = this.room.playerList.filter(p => p.playerId !== player.playerId);
    this.socketIoService.sendPlayerQuitRoom(this.room, player);
  }


  initRoom() {
    this.roomId = this.route.snapshot.paramMap.get('id') ?? 'undefined';
    this.player = this.socketIoService.currentPlayer;
    this.room = this.socketIoService.currentRoom;

    this.socketIoService.connect();

    this.recieveJoinedPlayers();
    this.recieveGameUpdate();

    this.socketIoService.playerJoinRoom(this.player, this.room);
  }

  recieveJoinedPlayers() {
    this.socketIoService.recieveJoinedPlayers().subscribe(roomU => {
      this.popMessage(roomU.response.updateMessage, 'Info', 'info');

      let newRoom: RoomDto = {
        roomId: roomU.roomId,
        statusId: 1,
        playerList: roomU.playerList,
        gameStarted: roomU.gameStarted,
        roomOwnerId: roomU.roomOwnerId,
        gameOrder: roomU.gameOrder,
        mahjong: roomU.mahjong
      }

      this.socketIoService.currentRoom = newRoom;
      this.room = newRoom;
    });
  }

  recieveGameUpdate() {
    this.socketIoService.recieveRoomUpdate().subscribe((room) => {
      if (room.response.isSuccess) {
        this.room = room;
        this.socketIoService.currentPlayer = room.playerList.find(p => p.playerId === this.player.playerId)!;
        this.popMessage(room.response.updateMessage, 'Info', 'info');
      }
      else {
        this.popMessage(room.response.updateMessage, 'Error', 'error');
      }
    });
  }

  startGame() {
    this.socketIoService.startGame(this.room);
  }

  updateRoom(room: RoomDto) {
    room.playerList.forEach(p => {
      this.gameService.updatePlayer(p).subscribe(res => {
        if (res.isSuccess) {
        }
      });
    });

    this.socketIoService.sendRoomUpdate(room);
  }

  drop(event: CdkDragDrop<MahjongDto[]>, mahjongList: MahjongDto[]) {
    moveItemInArray(mahjongList, event.previousIndex, event.currentIndex);
  }

  sortMahjongList(player: PlayerDto) {
    let newList: MahjongDto[] = player.mahjong.handTiles.mahjongTile;

    newList.sort((a, b) => a.order - b.order);

    this.room.playerList.find(p => p.playerId === player.playerId)!.mahjong.handTiles.mahjongTile = newList;
  }

  clickOtherPlayerTile() {
    this.popMessage("Don't touch other player's mahjong tile!!", 'Error', 'error');
  }

  selectedTileOutput(mahjong: MahjongDto, player: PlayerDto) {
    player.mahjong.handTiles.mahjongTile.forEach(m => {
      if (m.id !== mahjong.id) {
        m.isSelected = false;
      }
    });

    this.room.playerList.find(p => p.playerId === player.playerId)!.mahjong = player.mahjong;
  }

  anyButton() {
    this.nextTurn();
  }

  discardMahjong(player: PlayerDto) {
    if (player.mahjong.handTiles.mahjongTile.find(m => m.isSelected)) {
      this.socketIoService.sendDiscardMahjongTile(this.room, player, player.mahjong.handTiles.mahjongTile.find(m => m.isSelected)!)
    }
    else {
      this.popMessage("Please select a tile to discard.", 'Error', 'error');
    }
  }

  drawMahjong(player: PlayerDto) {
    this.socketIoService.sendDrawMahjong(this.room, player);
  }

  nextTurn() {
    this.socketIoService.sendNextTurn(this.room);
  }

  actionMahjong(action: string, player: PlayerDto) {
    switch (action) {
      case 'pong':
        this.socketIoService.sendMahjongAction('pong', this.room, player, this.room.mahjong.discardTiles[this.room.mahjong.discardTiles.length - 1]);
        break;
      case 'kong':
        this.socketIoService.sendMahjongAction('kong', this.room, player, this.room.mahjong.discardTiles[this.room.mahjong.discardTiles.length - 1]);
        break;
      case 'self-kong':
        let selectedMahjong = this.room.playerList.find(p => p.playerId === this.player.playerId)?.mahjong.handTiles.mahjongTile.find(m => m.isSelected);

        if (!selectedMahjong) {
          this.popMessage("Please select a tile to Kong.", 'Error', 'error');
        }
        else {
          this.socketIoService.sendMahjongAction('self-kong', this.room, player, selectedMahjong);
        }
        break;
    }
  }

  checkPoint(player: PlayerDto) {
    this.gameService.getCalculatePoint(player).subscribe(res => {
      if (res.isSuccess) {
        console.log(res.data)
      }
    })
  }
}
