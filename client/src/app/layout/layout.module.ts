import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CommonSharedModule } from '../core/shared/modules/common-shared.module';
import { MaterialModule } from '../core/shared/modules/material.module';
import { ComponentsModule } from '../core/shared/components/components.module';
import { PrimeNgModule } from '../core/shared/modules/primeng.module';
import { HelpToggleComponent } from './help-toggle/help-toggle.component';
import { TranslateToggleComponent } from './translate-toggle/translate-toggle.component';

@NgModule({
  declarations: [
    LayoutComponent,
    HeaderComponent,
    FooterComponent,
    HelpToggleComponent,
    TranslateToggleComponent
  ],
  imports: [
    CommonModule,
    CommonSharedModule,
    MaterialModule,
    ComponentsModule,
    PrimeNgModule,
  ],
  providers: [
    DatePipe
  ]
})
export class LayoutModule { }
