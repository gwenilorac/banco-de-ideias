import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Ideia } from '@shared/ideia.interface';

@Component({
  selector: 'app-card',
  imports: [RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly ideia = input.required<Ideia>();
  readonly propria = input(false);
  readonly votado = input(false);

  readonly votoSolicitado = output<Ideia>();
  readonly remocaoSolicitada = output<Ideia>();

  protected readonly rotuloDoVoto = computed(() => {
    if (this.propria()) {
      return 'Você não pode votar na sua própria ideia';
    }
    return this.votado() ? 'Remover meu voto' : 'Votar nesta ideia';
  });
}
