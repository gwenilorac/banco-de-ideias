import { Component, inject, input } from '@angular/core';
import { IdeiaInterface } from '@shared/ideia.interface';
import { Router } from "@angular/router";

@Component({
  selector: 'app-card',
  styleUrl: './card.component.scss',
  templateUrl: './card.component.html',
})
export class CardComponent {
  ideia = input.required<IdeiaInterface>();
  router = inject(Router)

  irParaEdicao(){
    this.router.navigate(['/ideia', this.ideia().id])
  }
  
}
