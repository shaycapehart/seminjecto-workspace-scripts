import {MessageService} from './services/message.service';
import {RollupService} from './services/rollup.service';
import {FileService} from './services/file.service';
import {OptionService} from './services/option.service';

export class Lib {
  optionService: OptionService;
  messageService: MessageService;
  fileService: FileService;
  rollupService: RollupService;

  constructor() {
    this.optionService = new OptionService();
    this.messageService = new MessageService();
    this.fileService = new FileService();
    this.rollupService = new RollupService();
  }
}
