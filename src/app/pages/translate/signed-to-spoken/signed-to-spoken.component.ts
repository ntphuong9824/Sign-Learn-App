import {Component, inject, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {VideoStateModel} from '../../../core/modules/ngxs/store/video/video.state';
import {InputMode} from '../../../modules/translate/translate.state';
import {
  CopySpokenLanguageText,
  SetSpokenLanguageText,
} from '../../../modules/translate/translate.actions';
import {Observable} from 'rxjs';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SignWritingComponent} from '../signwriting/sign-writing.component';
import {IonButton, IonIcon} from '@ionic/angular/standalone';
import {TextToSpeechComponent} from '../../../components/text-to-speech/text-to-speech.component';
import {UploadComponent} from './upload/upload.component';
import {addIcons} from 'ionicons';
import {copyOutline} from 'ionicons/icons';
import {TranslocoPipe} from '@jsverse/transloco';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {VideoModule} from '../../../components/video/video.module';

// TODO: Implement real signed-to-spoken translation using pose estimation
// Currently, there is no ML model implemented to convert pose data to text.
// This will require:
// 1. A trained model that can recognize sign language from pose data
// 2. A backend API endpoint to process the pose frames
// 3. Integration with the pose estimation module
// For now, the feature displays a placeholder message.

@Component({
  selector: 'app-signed-to-spoken',
  templateUrl: './signed-to-spoken.component.html',
  styleUrls: ['./signed-to-spoken.component.scss'],
  imports: [
    MatTooltipModule,
    SignWritingComponent,
    IonButton,
    TextToSpeechComponent,
    VideoModule,
    UploadComponent,
    IonIcon,
    TranslocoPipe,
    AsyncPipe,
    NgTemplateOutlet,
  ],
})
export class SignedToSpokenComponent implements OnInit {
  private store = inject(Store);

  videoState$!: Observable<VideoStateModel>;
  inputMode$!: Observable<InputMode>;
  spokenLanguage$!: Observable<string>;
  spokenLanguageText$!: Observable<string>;

  constructor() {
    this.videoState$ = this.store.select<VideoStateModel>(state => state.video);
    this.inputMode$ = this.store.select<InputMode>(state => state.translate.inputMode);
    this.spokenLanguage$ = this.store.select<string>(state => state.translate.spokenLanguage);
    this.spokenLanguageText$ = this.store.select<string>(state => state.translate.spokenLanguageText);

    this.store.dispatch(new SetSpokenLanguageText(''));

    addIcons({copyOutline});
  }

  ngOnInit(): void {
    // TODO: Implement real pose-to-text translation
    // This requires a trained ML model and backend API to process pose frames
    // For now, show a placeholder message indicating this feature is not yet implemented
    const placeholderMessage = 'Signed-to-Spoken translation is not yet implemented. Please use Spoken-to-Signed instead.';
    this.store.dispatch(new SetSpokenLanguageText(placeholderMessage));
  }

  copyTranslation() {
    this.store.dispatch(CopySpokenLanguageText);
  }
}
