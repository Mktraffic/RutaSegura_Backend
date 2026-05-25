import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateRouteDto,
  UpdateRouteDto,
  CreateRouteAssignmentDto,
  UpdateRouteAssignmentDto,
} from '../route.dto';

describe('Route DTOs', () => {
  describe('CreateRouteDto', () => {
    it('should create valid CreateRouteDto with all required fields', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.name).toBe('Route A1');
      expect(dto.routeType).toBe('PICKUP');
    });

    it('should fail validation when name is missing', async () => {
      const plainObject = {
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when name is too short', async () => {
      const plainObject = {
        name: 'AB',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when routeType is invalid', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'INVALID',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'routeType')).toBe(true);
    });

    it('should accept DROPOFF as valid routeType', async () => {
      const plainObject = {
        name: 'Route B1',
        routeType: 'DROPOFF',
        zoneId: 2,
        destinationId: 3,
        startTime: '14:00',
        vehiclePlate: 'XYZ-5678',
        driverPersonId: 6,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.routeType).toBe('DROPOFF');
    });

    it('should fail validation when startTime has invalid format', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '25:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when zoneId is less than 1', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 0,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional endTime when provided in valid format', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        endTime: '12:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.endTime).toBe('12:00');
    });

    it('should accept optional stops with valid array structure', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
        stops: [
          {
            stopOrder: 1,
            latitude: 4.7110,
            longitude: -74.0721,
            estimatedTime: '07:15',
          },
          {
            stopOrder: 2,
            latitude: 4.7200,
            longitude: -74.0800,
            estimatedTime: '07:30',
          },
        ],
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.stops?.length).toBe(2);
    });

    it('should fail validation when stops is empty array', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234',
        driverPersonId: 5,
        stops: [],
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when vehiclePlate is too long', async () => {
      const plainObject = {
        name: 'Route A1',
        routeType: 'PICKUP',
        zoneId: 1,
        destinationId: 2,
        startTime: '07:00',
        vehiclePlate: 'ABC-1234-EXTRA-LONGGG',
        driverPersonId: 5,
      };

      const dto = plainToClass(CreateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateRouteDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional name field', async () => {
      const plainObject = {
        name: 'Updated Route',
      };

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.name).toBe('Updated Route');
    });

    it('should accept optional routeType field', async () => {
      const plainObject = {
        routeType: 'DROPOFF',
      };

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.routeType).toBe('DROPOFF');
    });

    it('should fail validation if name is too short', async () => {
      const plainObject = {
        name: 'AB',
      };

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid routeType', async () => {
      const plainObject = {
        routeType: 'INVALID',
      };

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept multiple optional fields together', async () => {
      const plainObject = {
        name: 'Route Updated',
        startTime: '08:00',
        endTime: '14:00',
        status: 'ACTIVE',
      };

      const dto = plainToClass(UpdateRouteDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });
  });

  describe('CreateRouteAssignmentDto', () => {
    it('should create valid CreateRouteAssignmentDto', async () => {
      const plainObject = {
        personId: 10,
        personAddressId: 5,
      };

      const dto = plainToClass(CreateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.personId).toBe(10);
      expect(dto.personAddressId).toBe(5);
    });

    it('should fail validation when personId is missing', async () => {
      const plainObject = {
        personAddressId: 5,
      };

      const dto = plainToClass(CreateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'personId')).toBe(true);
    });

    it('should fail validation when personId is less than 1', async () => {
      const plainObject = {
        personId: 0,
        personAddressId: 5,
      };

      const dto = plainToClass(CreateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when personAddressId is missing', async () => {
      const plainObject = {
        personId: 10,
      };

      const dto = plainToClass(CreateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'personAddressId')).toBe(true);
    });

    it('should convert string numbers to numbers', async () => {
      const plainObject = {
        personId: '10',
        personAddressId: '5',
      };

      const dto = plainToClass(CreateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.personId).toBe('number');
      expect(typeof dto.personAddressId).toBe('number');
    });
  });

  describe('UpdateRouteAssignmentDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional status field', async () => {
      const plainObject = {
        status: 'COMPLETED',
      };

      const dto = plainToClass(UpdateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe('COMPLETED');
    });

    it('should fail validation if status exceeds max length', async () => {
      const plainObject = {
        status: 'A'.repeat(21),
      };

      const dto = plainToClass(UpdateRouteAssignmentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
