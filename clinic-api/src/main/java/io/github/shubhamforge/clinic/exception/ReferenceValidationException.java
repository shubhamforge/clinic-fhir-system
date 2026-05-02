package io.github.shubhamforge.clinic.exception;

public class ReferenceValidationException extends RuntimeException {

  public ReferenceValidationException(String referencedType, String id) {
    super("Referenced " + referencedType + " with id '" + id + "' does not exist");
  }
}
