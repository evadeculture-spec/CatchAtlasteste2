// Sugestões de preparação explicáveis, baseadas em regras simples sobre o plano.
// Não garantem capturas nem representam análise científica.
import type { Journey } from '../types';
import type { DemoConditions } from './conditions';
import { minutesOf } from './conditions';
import { speciesById } from '../data/constants';

export interface Suggestion {
  id: string;
  title: string;
  text: string;
  reason: string;
  source: 'plano' | 'exemplo';
}

export function buildSuggestions(j: Journey, c: DemoConditions): Suggestion[] {
  const out: Suggestion[] = [];
  const sp = speciesById(j.targetSpecies);

  const start = minutesOf(j.startTime);
  const nearSunrise = Math.abs(start - minutesOf(c.sunrise)) <= 90;
  const nearSunset = Math.abs(start - minutesOf(c.sunset)) <= 120;
  if (nearSunrise || nearSunset) {
    out.push({
      id: 'luz',
      title: 'Aproveita a luz baixa',
      text: 'Chega ao local com tempo para montar o material antes de começar e para observar a água enquanto a luz muda.',
      reason: `A jornada começa às ${j.startTime}, perto do ${nearSunrise ? `nascer do sol (${c.sunrise})` : `pôr do sol (${c.sunset})`}.`,
      source: 'plano',
    });
  }

  switch (j.targetSpecies) {
    case 'achiga':
      out.push({
        id: 'estrutura',
        title: 'Procura estrutura',
        text: 'Experimenta explorar estruturas submersas — troncos, rochas, quebras de profundidade — com uma montagem adequada à profundidade.',
        reason: 'Espécie-alvo: achigã.',
        source: 'plano',
      });
      break;
    case 'lucio':
      out.push({
        id: 'terminal',
        title: 'Protege a linha dos dentes',
        text: 'Leva um terminal resistente e um alicate de bocas longas para manusear o peixe com rapidez e segurança.',
        reason: 'Espécie-alvo: lúcio.',
        source: 'plano',
      });
      break;
    case 'lucioperca':
      out.push({
        id: 'fundo',
        title: 'Trabalha perto do fundo',
        text: 'Leva amostras que consigas manter junto ao fundo e várias gramagens para te adaptares à profundidade.',
        reason: 'Espécie-alvo: lucioperca.',
        source: 'plano',
      });
      break;
    case 'siluro':
      out.push({
        id: 'robusto',
        title: 'Material dimensionado',
        text: 'Confirma que linha, nós e travão estão à altura de um peixe de grande porte e que tens forma de o manusear sem o magoar.',
        reason: 'Espécie-alvo: siluro.',
        source: 'plano',
      });
      break;
    case 'truta':
      out.push({
        id: 'discricao',
        title: 'Discrição',
        text: 'Amostras pequenas, linha fina e aproximação cuidadosa à margem costumam fazer diferença em águas claras.',
        reason: 'Espécie-alvo: truta.',
        source: 'plano',
      });
      break;
    default:
      if (!sp) {
        out.push({
          id: 'variedade',
          title: 'Mantém opções em aberto',
          text: 'Sem espécie definida, leva uma seleção curta de amostras para diferentes profundidades.',
          reason: 'Ainda não escolheste espécie-alvo.',
          source: 'plano',
        });
      }
  }

  if (c.windKmh >= 15) {
    out.push({
      id: 'vento',
      title: 'Conta com o vento',
      text:
        j.modality === 'float-tube'
          ? 'Em float tube, o vento pesa na deriva e no regresso. Avalia no local se as condições são seguras antes de entrar na água.'
          : 'Escolhe amostras com peso suficiente para manter o controlo e considera margens abrigadas.',
      reason: `Vento demonstrativo de ${c.windKmh} km/h.`,
      source: 'plano',
    });
  }

  if (j.modality === 'embarcacao') {
    out.push({
      id: 'barco',
      title: 'Verificação da embarcação',
      text: 'Confirma coletes, bateria ou combustível, âncora e meios de comunicação antes de sair.',
      reason: 'Modalidade: embarcação.',
      source: 'plano',
    });
  }

  if (c.tempMax >= 26) {
    out.push({
      id: 'calor',
      title: 'Calor',
      text: 'Reforça a água e a proteção solar e planeia pausas à sombra nas horas centrais.',
      reason: `Máxima demonstrativa de ${c.tempMax} °C.`,
      source: 'plano',
    });
  }

  if (j.techniques.length === 0) {
    out.push({
      id: 'tecnicas',
      title: 'Define 2 ou 3 técnicas',
      text: 'Escolher poucas técnicas antes de sair ajuda a preparar a caixa e a comparar resultados no diário.',
      reason: 'O plano ainda não tem técnicas preferidas.',
      source: 'plano',
    });
  }

  out.push({
    id: 'comunidade-demo',
    title: 'Exemplo demonstrativo',
    text: 'Num conjunto fictício de registos de outros pescadores, vinis e jigs aparecem entre as opções mais usadas neste tipo de jornada.',
    reason: 'Dados fictícios para ilustrar a funcionalidade. Não resulta da análise de uma comunidade real.',
    source: 'exemplo',
  });

  return out;
}
