import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AppProvider } from 'src/app/providers';
import { Logger } from 'src/app/providers/logger/logger';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'message-reply-component',
  templateUrl: './message-reply.component.html',
  styleUrls: ['./message-reply.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MessageReplyComponent extends ActionSheetParent{
  messageReplyInfo: any;
  public messageReplySend: FormGroup;
  messageOnChainValue;
  constructor(
    private formBuilder: FormBuilder,
  ) { 
    super();
    this.messageReplySend = this.formBuilder.group({
        messageOnChain: [
          '',
          []
        ]
    });
  }

  ngOnInit() {
    this.messageReplyInfo = this.params;
  }

  send(){
    const message = this.messageReplySend.value.messageOnChain;
    this.dismiss(message);
  }
}
