import { Component } from '@angular/core';

/** Decisão de arquitetura que a landing expõe, com o porquê em uma linha. */
export interface DecisaoLanding {
  titulo: string;
  texto: string;
}

/**
 * Faixa dirigida a quem avalia o projeto tecnicamente. Os itens saem do que está no código dos
 * dois repositórios — versões e decisões conferidas, não estimadas. Ao subir a versão do
 * Angular ou trocar uma decisão de arquitetura, esta lista muda junto.
 */
@Component({
  selector: 'app-landing-tecnologia',
  imports: [],
  templateUrl: './landing-tecnologia.component.html',
  styleUrl: './landing-tecnologia.component.scss'
})
export class LandingTecnologiaComponent {
  readonly backend = ['Java 21', 'Spring Boot 3.4', 'PostgreSQL 16', 'Flyway', 'Caffeine', 'JUnit 5'];
  readonly frontend = ['Angular 21', 'TypeScript 5.9 strict', 'RxJS', 'SCSS', 'Karma + Jasmine'];
  readonly infra = ['Docker', 'Docker Compose', 'nginx', 'Actuator', 'Prometheus'];

  readonly decisoes: DecisaoLanding[] = [
    {
      titulo: 'Otimização, não heurística',
      texto:
        'O time com teto de cartoletas sai de uma busca branch-and-bound com poda: é o de maior score dentro do orçamento, e não o primeiro que couber. Custo-benefício entra só como critério de desempate.'
    },
    {
      titulo: 'Cache com orçamento de cota',
      texto:
        'As respostas das APIs externas ficam em cache Caffeine de 10 a 60 minutos, com invalidação sob demanda. A cota da The Odds API é finita e o cache é o que a faz durar o mês.'
    },
    {
      titulo: 'Configuração de negócio em runtime',
      texto:
        'Pesos do score, limite de odd e formação vivem no banco, versionado por Flyway, e mudam por PATCH sem reiniciar a aplicação.'
    },
    {
      titulo: 'API fechada por JWT',
      texto:
        'Todo endpoint exige token, o perfil sai dos claims e as guardas do frontend são conveniência de tela — a autorização real é sempre a do backend.'
    },
    {
      titulo: 'Observabilidade desde o começo',
      texto:
        'Actuator e Micrometer expõem health e métricas em formato Prometheus; o frontend roda atrás de nginx com proxy de /api e cabeçalhos de segurança.'
    },
    {
      titulo: 'Prestação de contas',
      texto:
        'Cada escalação sugerida é persistida e depois confrontada com a pontuação real da rodada — a mesma tela que recomenda é a que mostra se acertou.'
    }
  ];

  readonly repositorios = [
    {
      nome: 'cartolaoddsapi',
      descricao: 'API REST em Java 21 e Spring Boot',
      url: 'https://github.com/FabioCarlesso/cartolaoddsapi'
    },
    {
      nome: 'cartolaoddsfe',
      descricao: 'Frontend Angular 21 (esta aplicação)',
      url: 'https://github.com/FabioCarlesso/cartolaoddsfe'
    }
  ];
}
