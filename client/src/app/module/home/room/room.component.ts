import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketioService } from '../../../core/services/socketIo.service';
import { GameService, MahjongDto, PlayerDto, RoomDto } from '../../../core/services/game.service';
import { MessageService } from 'primeng/api';
import { BaseCoreAbstract } from '../../../core/shared/base/base-core.abstract';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TranslateService } from '@ngx-translate/core';
import { CONTROL_TYPE, FormConfig } from '../../../core/services/components.service';
import { FormControl, FormGroup } from '@angular/forms';

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
  chowVisible: boolean;
  selectedChowList: MahjongDto[] = [];
  roomSettingVisible: boolean = false;
  settingFormConfig: FormConfig[] = [];
  settingFormGroup: FormGroup = new FormGroup({
    minPoints: new FormControl(5),
    score: new FormControl(1),
    initTotalScore: new FormControl(100),
  })

  constructor(
    private socketIoService: SocketioService,
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    protected override messageService: MessageService,
    private translateService: TranslateService
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
      case 'S':
        this.roomSettingVisible = true;
        break;
    }
  }

  playerQuited(player: PlayerDto) {
    this.room.playerList = this.room.playerList.filter(p => p.playerId !== player.playerId);
    this.socketIoService.sendPlayerQuitRoom(this.room, player);
  }

  returnPlayerTurnName(): string {
    return this.room.playerList.find(p => p.direction === this.room.gameOrder)?.playerName!;
  }

  initRoom() {
    this.roomId = this.route.snapshot.paramMap.get('id') ?? 'undefined';
    this.player = this.socketIoService.currentPlayer;
    this.room = this.socketIoService.currentRoom;
    this.initSettingForm();

    this.socketIoService.connect();

    this.recieveJoinedPlayers();
    this.recieveGameUpdate();

    this.socketIoService.playerJoinRoom(this.player, this.room);
  }

  initSettingForm() {
    this.settingFormGroup.controls['minPoints'].setValue(this.room.mahjong.setting.minPoints);
    this.settingFormGroup.controls['score'].setValue(this.room.mahjong.setting.score);
    this.settingFormGroup.controls['initTotalScore'].setValue(this.room.mahjong.setting.initTotalScore);

    this.settingFormConfig = [
      {
        label: 'INPUT.MIN_POINT',
        type: CONTROL_TYPE.Textbox,
        layoutDefine: {
          row: 0,
          column: 0,
        },
        fieldControl: this.settingFormGroup.controls['minPoints'],
        mode: 'number'
      },
      {
        label: 'INPUT.SCORE',
        type: CONTROL_TYPE.Textbox,
        layoutDefine: {
          row: 1,
          column: 0,
        },
        fieldControl: this.settingFormGroup.controls['score'],
        mode: 'number'
      },
      {
        label: 'INPUT.INIT_TOTAL_SCORE',
        type: CONTROL_TYPE.Textbox,
        layoutDefine: {
          row: 2,
          column: 0,
        },
        fieldControl: this.settingFormGroup.controls['initTotalScore'],
        mode: 'number'
      },
    ];
  }

  recieveJoinedPlayers() {
    this.socketIoService.recieveJoinedPlayers().subscribe(roomU => {
      this.popMessage(roomU.response.updateMessage, 'info');

      let newRoom: RoomDto = {
        roomId: roomU.roomId,
        roomCode: roomU.roomCode,
        statusId: 1,
        playerList: roomU.playerList,
        gameStarted: roomU.gameStarted,
        roomOwnerId: roomU.roomOwnerId,
        gameOrder: roomU.gameOrder,
        mahjong: roomU.mahjong,
        waiting: roomU.waiting,
        waitingPlayer: roomU.waitingPlayer,
        waitingAction: roomU.waitingAction,
      }

      this.socketIoService.currentRoom = newRoom;
      this.room = newRoom;
    });
  }

  recieveGameUpdate() {
    this.socketIoService.recieveRoomUpdate().subscribe((room) => {
      if (room.response.isSuccess) {
        this.room = room;
        this.initSettingForm();
        this.socketIoService.currentPlayer = room.playerList.find(p => p.playerId === this.player.playerId)!;
        this.player = this.socketIoService.currentPlayer;
        this.popMessage(room.response.updateMessage, 'info');
      }
      else {
        this.popMessage(room.response.updateMessage, 'error');
      }
    });
  }

  startGame() {
    this.socketIoService.startGame(this.room);
    // this.socketIoService.startTestGame(this.room);
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
    this.popMessage("Don't touch other player's mahjong tile!!", 'error');
  }

  selectedTileOutput(mahjong: MahjongDto, player: PlayerDto) {
    player.mahjong.handTiles.mahjongTile.forEach(m => {
      if (m.id !== mahjong.id) {
        m.isSelected = false;
      }
    });

    this.room.playerList.find(p => p.playerId === player.playerId)!.mahjong = player.mahjong;
  }

  selectedTileOutput2(mahjong: MahjongDto, player: PlayerDto) {
    player.mahjong.handTiles.mahjongTile.forEach(m => {
      if (m.id === mahjong.id) {
        m = mahjong;
      }
      if (m.isSelected && !this.selectedChowList.find(mah => mah.id === m.id)) {
        this.selectedChowList.push(m);
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
      this.popMessage(this.translateService.instant("ACTION.MESSAGE.SELECTE_TILE_DISCARD"), 'error');
    }
  }

  checkIsTileSelected(player: PlayerDto) {
    return !player.mahjong.handTiles.mahjongTile.find(m => m.isSelected);
  }

  checkIsTileFullNow(player: PlayerDto) {
    return (player.mahjong.handTiles.mahjongTile.length - 2) % 3 === 0;
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
      case 'chow':
        this.player.mahjong.handTiles.mahjongTile.forEach(m => {
          m.isSelected = false;
        });
        this.selectedChowList = [];
        this.chowVisible = true;
        break;
      case 'kong':
        this.socketIoService.sendMahjongAction('kong', this.room, player, this.room.mahjong.discardTiles[this.room.mahjong.discardTiles.length - 1]);
        break;
      case 'self-kong':
        let selectedMahjong = this.room.playerList.find(p => p.playerId === this.player.playerId)?.mahjong.handTiles.mahjongTile.find(m => m.isSelected);

        if (!selectedMahjong) {
          this.popMessage(this.translateService.instant("ACTION.MESSAGE.SELECTE_TILE_KONG"), 'error');
        }
        else {
          this.socketIoService.sendMahjongAction('self-kong', this.room, player, selectedMahjong);
        }
        break;
      case 'win':
        this.checkPoint(player)
        break;
      case 'cancel':
        this.socketIoService.sendMahjongAction('cancel', this.room, player, this.room.mahjong.discardTiles[this.room.mahjong.discardTiles.length - 1]);
        break;

    }
  }

  checkPoint(player: PlayerDto) {
    this.gameService.getCalculatePoint(player).subscribe(res => {
      if (res.isSuccess) {
        console.log(res.data)
      }
      else {
        console.log('not winning', res.data)
      }
    })
  }

  cancelChow() {
    this.player.mahjong.handTiles.mahjongTile.forEach(m => {
      m.isSelected = false;
    });

    this.room.playerList.find(p => p.playerId === this.player.playerId)!.mahjong = this.player.mahjong;
    this.selectedChowList = [];
    this.chowVisible = false;
  }

  sendChow() {
    if (this.selectedChowList.length !== 2) {
      this.popMessage(this.translateService.instant("ACTION.MESSAGE.SELECTE_TILE_CHOW"), 'error');
    }
    else {
      this.socketIoService.sendChow(this.room, this.player, this.selectedChowList, this.room.mahjong.discardTiles[this.room.mahjong.discardTiles.length - 1]);
      this.cancelChow();
    }
  }

  returnIsShowingCancelButton(player: PlayerDto): boolean {
    return (player.action.isChowable || player.action.isKongable || player.action.isPongable || player.action.isSelfKongable || player.action.isWinnable);
  }

  saveSetting() {
    if (this.settingFormGroup.valid) {
      let roomU = this.room;
      roomU.mahjong.setting.minPoints = this.settingFormGroup.controls['minPoints'].value;
      roomU.mahjong.setting.score = this.settingFormGroup.controls['score'].value;
      roomU.mahjong.setting.initTotalScore = this.settingFormGroup.controls['initTotalScore'].value;

      this.socketIoService.sendRoomUpdate(roomU);
      this.roomSettingVisible = false
    }
  }

  cancelSetting() {
    this.settingFormGroup.controls['minPoints'].setValue(this.room.mahjong.setting.minPoints);
    this.settingFormGroup.controls['score'].setValue(this.room.mahjong.setting.score);
    this.settingFormGroup.controls['initTotalScore'].setValue(this.room.mahjong.setting.initTotalScore);
    this.roomSettingVisible = false;
  }
}
