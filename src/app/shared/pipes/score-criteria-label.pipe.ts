import { Pipe, PipeTransform } from '@angular/core';
import { Atleta } from '../models/atleta.model';
import { getScoreCriteriaLabel } from '../utils/score-info.util';

@Pipe({ name: 'scoreCriteriaLabel', standalone: true, pure: true })
export class ScoreCriteriaLabelPipe implements PipeTransform {
  transform(atleta: Atleta): string {
    return getScoreCriteriaLabel(atleta);
  }
}
