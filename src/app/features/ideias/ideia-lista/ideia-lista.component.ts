import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CardComponent } from '@shared/card/card.component';
import { Ideia } from '@shared/ideia.interface';

@Component({
  selector: 'app-ideia-lista',
  imports: [CardComponent],
  templateUrl: './ideia-lista.component.html',
  styleUrl: './ideia-lista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeiaListaComponent {
  readonly ideias = input.required<readonly Ideia[]>();
  readonly idsProprios = input.required<ReadonlySet<number>>();
  readonly idsVotados = input.required<ReadonlySet<number>>();
  readonly carregando = input(false);

  readonly votoSolicitado = output<Ideia>();
  readonly remocaoSolicitada = output<Ideia>();
}
