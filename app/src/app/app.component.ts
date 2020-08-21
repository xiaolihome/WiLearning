import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

import { MenuController, Platform, ToastController, PopoverController } from '@ionic/angular';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Storage } from '@ionic/storage';

import { UserData } from './providers/user-data';
import { audit } from 'rxjs/operators';
import { SharepopoverComponent } from './popover/sharepopover/sharepopover.component';
import { ChatComponent } from './chat/chat.component';
import { NetstatComponent } from './popover/netstat/netstat.component';
import { SettingComponent } from './popover/setting/setting.component';
import { MoreComponent } from './popover/more/more.component';
import { ProfileService } from './service/profile.service';
import { PeerService } from './service/peer.service';
import { WebsocketService } from './service/websocket.service';
import { LoggerService } from './service/logger.service';
import { ChatService } from './service/chat.service';
import { EmojiComponent } from './popover/emoji/emoji.component';
import { EventbusService, IEventType, EventType } from './service/eventbus.service';

enum BoardComp {
  video = 'video',
  welcome = 'welcome',
  document = 'document',
  whiteboard = 'whiteboard',
  sharedesk = 'sharedesk',
  sharemedia = 'sharemedia',
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  loggedIn = false;
  menuPage = 'member';

  boardcomp = BoardComp.welcome;
  inputMessage = '';

  constructor(
    public popoverController: PopoverController,
    public profile: ProfileService,
    public peer: PeerService,
    public chat: ChatService,
    private menu: MenuController,
    private platform: Platform,
    private router: Router,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private storage: Storage,
    private userData: UserData,
    private socket: WebsocketService,
    private logger: LoggerService,
    private eventbus: EventbusService,
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    this.checkLoginStatus();
    this.listenForLoginEvents();

    window.addEventListener('event:openvideocomp', () => {
      this.boardcomp = BoardComp.video;
    });
    window.addEventListener('event:openwelcomecomp', () => {
      this.boardcomp = BoardComp.welcome;
    });

    this.eventbus.chat$.subscribe((event: IEventType) => {
      if (event.type === EventType.chat_emoji) {
        this.inputMessage += event.data;
      }
    });

    this.eventbus.socket$.subscribe(async (event: IEventType) => {
      if (event.type === EventType.socket_connected) {
        await this.peer.init();
        await this.peer.roomUpdate();
        await this.peer.connectMediaServer();
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.socket.connect();
    });
  }

  checkLoginStatus() {
    return this.userData.isLoggedIn().then(loggedIn => {
      return this.updateLoggedInStatus(loggedIn);
    });
  }

  updateLoggedInStatus(loggedIn: boolean) {
    setTimeout(() => {
      this.loggedIn = loggedIn;
    }, 300);
  }

  listenForLoginEvents() {
    window.addEventListener('user:login', () => {
      this.updateLoggedInStatus(true);
    });

    window.addEventListener('user:signup', () => {
      this.updateLoggedInStatus(true);
    });

    window.addEventListener('user:logout', () => {
      this.updateLoggedInStatus(false);
    });
  }

  logout() {
    this.userData.logout().then(() => {
      return this.router.navigateByUrl('/app/tabs/schedule');
    });
  }

  async sharePopover(ev) {
    const popover = await this.popoverController.create({
      component: SharepopoverComponent,
      event: ev,
      translucent: true
    });
    return popover.present();
  }

  async morePopover(ev) {
    const popover = await this.popoverController.create({
      component: MoreComponent,
      event: ev,
      translucent: true
    });
    return popover.present();
  }

  async settingPopover(ev) {
    const popover = await this.popoverController.create({
      component: SettingComponent,
      event: ev,
      translucent: true
    });
    return popover.present();
  }

  async netstatPopover(ev) {
    const popover = await this.popoverController.create({
      component: NetstatComponent,
      event: ev,
      translucent: true
    });
    return popover.present();
  }

  segmentChanged(ev) {
    this.menuPage = ev.detail.value;
  }

  openMember() {
    this.menu.open();
    document.getElementById('memberButton').click();
  }

  openChat() {
    this.menu.open();
    document.getElementById('chatButton').click();
  }

  sendToChange(ev) {
    this.logger.debug(ev.detail.value);
  }

  sendMessage(message) {
    this.logger.debug(message);
  }

  async openEmoji(ev) {
    const popover = await this.popoverController.create({
      component: EmojiComponent,
      event: ev,
      translucent: true
    });
    return popover.present();

  }
}