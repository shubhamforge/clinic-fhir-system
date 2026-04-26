package io.github.shubhamforge.clinic.mapper;

import io.github.shubhamforge.clinic.dto.EncounterRequest;
import java.time.ZoneId;
import java.util.Date;
import org.hl7.fhir.r4.model.CodeableConcept;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.Period;
import org.hl7.fhir.r4.model.Reference;
import org.springframework.stereotype.Component;

@Component
public class EncounterMapper {

  public Encounter toFhir(EncounterRequest request) {
    Encounter encounter = new Encounter();
    encounter.setSubject(new Reference("Patient/" + request.patientId()));
    encounter.setStatus(Encounter.EncounterStatus.fromCode(request.status()));
    Date startDate =
        Date.from(request.visitDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
    encounter.setPeriod(new Period().setStart(startDate));
    if (request.reason() != null) {
      encounter.addReasonCode(new CodeableConcept().setText(request.reason()));
    }
    return encounter;
  }
}
