package io.github.shubhamforge.clinic.exception;

public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String resourceType, String id) {
    super(resourceType + " with id '" + id + "' not found");
  }
}
