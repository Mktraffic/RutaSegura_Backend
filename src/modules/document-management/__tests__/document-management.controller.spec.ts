import { Test, TestingModule } from '@nestjs/testing';
import { DocumentManagementController } from '../document-management.controller';
import { DocumentManagementService } from '../document-management.service';
import {
  validCreateDocumentTypeDto,
  updateDocumentTypeDto,
  documentTypeInDatabase,
  documentTypeInDatabaseList,
  validCreatePersonDocumentDto,
  updatePersonDocumentDto,
  personDocumentInDatabase,
  personDocumentList,
  validCreateVehicleDocumentDto,
  updateVehicleDocumentDto,
  vehicleDocumentInDatabase,
  vehicleDocumentList,
  alertInDatabase,
  alertList,
} from './fixtures/document-management.fixture';

describe('DocumentManagementController', () => {
  let controller: DocumentManagementController;
  let service: DocumentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentManagementController],
      providers: [
        {
          provide: DocumentManagementService,
          useValue: {
            findDocumentTypes: jest.fn(),
            createDocumentType: jest.fn(),
            updateDocumentType: jest.fn(),
            createPersonDocument: jest.fn(),
            findPersonDocuments: jest.fn(),
            updatePersonDocument: jest.fn(),
            inactivatePersonDocument: jest.fn(),
            createVehicleDocument: jest.fn(),
            findVehicleDocuments: jest.fn(),
            updateVehicleDocument: jest.fn(),
            inactivateVehicleDocument: jest.fn(),
            generateExpiryAlerts: jest.fn(),
            findAlerts: jest.fn(),
            markAlertAsRead: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentManagementController>(DocumentManagementController);
    service = module.get<DocumentManagementService>(DocumentManagementService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findDocumentTypes', () => {
    it('should return all document types with success response', async () => {
      jest.spyOn(service, 'findDocumentTypes').mockResolvedValueOnce(documentTypeInDatabaseList);

      const result = await controller.findDocumentTypes();

      expect(result).toEqual({
        success: true,
        message: 'Listado de tipos de documento',
        data: documentTypeInDatabaseList,
      });
      expect(service.findDocumentTypes).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered document types with query', async () => {
      const query = 'Pasaporte';
      jest.spyOn(service, 'findDocumentTypes').mockResolvedValueOnce([documentTypeInDatabaseList[1]]);

      const result = await controller.findDocumentTypes(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de tipos de documento',
        data: [documentTypeInDatabaseList[1]],
      });
      expect(service.findDocumentTypes).toHaveBeenCalledWith(query);
    });

    it('should trim query parameter', async () => {
      const query = '  Pasaporte  ';
      jest.spyOn(service, 'findDocumentTypes').mockResolvedValueOnce([documentTypeInDatabaseList[1]]);

      await controller.findDocumentTypes(query);

      expect(service.findDocumentTypes).toHaveBeenCalledWith('Pasaporte');
    });
  });

  describe('createDocumentType', () => {
    it('should create a document type and return success response', async () => {
      jest.spyOn(service, 'createDocumentType').mockResolvedValueOnce(documentTypeInDatabase as any);

      const result = await controller.createDocumentType(validCreateDocumentTypeDto);

      expect(result).toEqual({
        success: true,
        message: 'Tipo de documento creado correctamente',
        data: documentTypeInDatabase,
      });
      expect(service.createDocumentType).toHaveBeenCalledWith(validCreateDocumentTypeDto);
    });
  });

  describe('updateDocumentType', () => {
    it('should update a document type and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'updateDocumentType').mockResolvedValueOnce({
        ...documentTypeInDatabase,
        name: updateDocumentTypeDto.name,
      } as any);

      const result = await controller.updateDocumentType(id, updateDocumentTypeDto);

      expect(result).toEqual({
        success: true,
        message: 'Tipo de documento actualizado correctamente',
        data: {
          ...documentTypeInDatabase,
          name: updateDocumentTypeDto.name,
        },
      });
      expect(service.updateDocumentType).toHaveBeenCalledWith(id, updateDocumentTypeDto);
    });
  });

  describe('createPersonDocument', () => {
    it('should create a person document and return success response', async () => {
      jest.spyOn(service, 'createPersonDocument').mockResolvedValueOnce(personDocumentInDatabase as any);

      const result = await controller.createPersonDocument(validCreatePersonDocumentDto);

      expect(result).toEqual({
        success: true,
        message: 'Documento de persona creado correctamente',
        data: personDocumentInDatabase,
      });
      expect(service.createPersonDocument).toHaveBeenCalledWith(validCreatePersonDocumentDto);
    });
  });

  describe('findPersonDocuments', () => {
    it('should return all person documents with success response', async () => {
      const personDocList = [
        {
          ...personDocumentInDatabase,
          createdAt: new Date('2024-01-15'),
        },
      ];
      jest.spyOn(service, 'findPersonDocuments').mockResolvedValueOnce(personDocList as any);

      const result = await controller.findPersonDocuments();

      expect(result).toEqual({
        success: true,
        message: 'Listado de documentos de persona',
        data: personDocList,
      });
      expect(service.findPersonDocuments).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered person documents with query', async () => {
      const query = 'DOC123456';
      const personDocList = [
        {
          ...personDocumentInDatabase,
          createdAt: new Date('2024-01-15'),
        },
      ];
      jest.spyOn(service, 'findPersonDocuments').mockResolvedValueOnce(personDocList as any);

      const result = await controller.findPersonDocuments(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de documentos de persona',
        data: personDocList,
      });
      expect(service.findPersonDocuments).toHaveBeenCalledWith(query);
    });
  });

  describe('updatePersonDocument', () => {
    it('should update a person document and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'updatePersonDocument').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        documentNumber: updatePersonDocumentDto.documentNumber,
      } as any);

      const result = await controller.updatePersonDocument(id, updatePersonDocumentDto);

      expect(result).toEqual({
        success: true,
        message: 'Documento de persona actualizado correctamente',
        data: {
          ...personDocumentInDatabase,
          documentNumber: updatePersonDocumentDto.documentNumber,
        },
      });
      expect(service.updatePersonDocument).toHaveBeenCalledWith(id, updatePersonDocumentDto);
    });
  });

  describe('inactivatePersonDocument', () => {
    it('should inactivate a person document and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'inactivatePersonDocument').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivatePersonDocument(id);

      expect(result).toEqual({
        success: true,
        message: 'Documento de persona inactivado correctamente',
        data: {
          ...personDocumentInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivatePersonDocument).toHaveBeenCalledWith(id);
    });
  });

  describe('createVehicleDocument', () => {
    it('should create a vehicle document and return success response', async () => {
      jest.spyOn(service, 'createVehicleDocument').mockResolvedValueOnce(vehicleDocumentInDatabase as any);

      const result = await controller.createVehicleDocument(validCreateVehicleDocumentDto);

      expect(result).toEqual({
        success: true,
        message: 'Documento de vehiculo creado correctamente',
        data: vehicleDocumentInDatabase,
      });
      expect(service.createVehicleDocument).toHaveBeenCalledWith(validCreateVehicleDocumentDto);
    });
  });

  describe('findVehicleDocuments', () => {
    it('should return all vehicle documents with success response', async () => {
      jest.spyOn(service, 'findVehicleDocuments').mockResolvedValueOnce(vehicleDocumentList as any);

      const result = await controller.findVehicleDocuments();

      expect(result).toEqual({
        success: true,
        message: 'Listado de documentos de vehiculo',
        data: vehicleDocumentList,
      });
      expect(service.findVehicleDocuments).toHaveBeenCalledWith(undefined);
    });
  });

  describe('updateVehicleDocument', () => {
    it('should update a vehicle document and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'updateVehicleDocument').mockResolvedValueOnce({
        ...vehicleDocumentInDatabase,
        documentNumber: updateVehicleDocumentDto.documentNumber,
      } as any);

      const result = await controller.updateVehicleDocument(id, updateVehicleDocumentDto);

      expect(result).toEqual({
        success: true,
        message: 'Documento de vehiculo actualizado correctamente',
        data: {
          ...vehicleDocumentInDatabase,
          documentNumber: updateVehicleDocumentDto.documentNumber,
        },
      });
      expect(service.updateVehicleDocument).toHaveBeenCalledWith(id, updateVehicleDocumentDto);
    });
  });

  describe('inactivateVehicleDocument', () => {
    it('should inactivate a vehicle document and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'inactivateVehicleDocument').mockResolvedValueOnce({
        ...vehicleDocumentInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivateVehicleDocument(id);

      expect(result).toEqual({
        success: true,
        message: 'Documento de vehiculo inactivado correctamente',
        data: {
          ...vehicleDocumentInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivateVehicleDocument).toHaveBeenCalledWith(id);
    });
  });

  describe('generateExpiryAlerts', () => {
    it('should generate expiry alerts with default days ahead', async () => {
      jest.spyOn(service, 'generateExpiryAlerts').mockResolvedValueOnce({
        count: 5,
      } as any);

      const result = await controller.generateExpiryAlerts();

      expect(result).toEqual({
        success: true,
        message: 'Alertas de vencimiento generadas correctamente',
        data: {
          count: 5,
        },
      });
      expect(service.generateExpiryAlerts).toHaveBeenCalledWith(30);
    });

    it('should generate expiry alerts with custom days ahead', async () => {
      jest.spyOn(service, 'generateExpiryAlerts').mockResolvedValueOnce({
        count: 3,
      } as any);

      const result = await controller.generateExpiryAlerts('60');

      expect(result).toEqual({
        success: true,
        message: 'Alertas de vencimiento generadas correctamente',
        data: {
          count: 3,
        },
      });
      expect(service.generateExpiryAlerts).toHaveBeenCalledWith(60);
    });
  });

  describe('findAlerts', () => {
    it('should return all alerts with success response', async () => {
      jest.spyOn(service, 'findAlerts').mockResolvedValueOnce({
        items: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          page: 1,
          limit: 10,
        },
      } as any);

      const query = { skip: 0, take: 10 };
      const result = await controller.findAlerts(query as any);

      expect(result).toEqual({
        success: true,
        message: 'Listado de alertas documentales',
        data: {
          items: [],
          meta: {
            totalItems: 0,
            totalPages: 0,
            page: 1,
            limit: 10,
          },
        },
      });
      expect(service.findAlerts).toHaveBeenCalledWith(query);
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark an alert as read and return success response', async () => {
      const id = 1;
      jest.spyOn(service, 'markAlertAsRead').mockResolvedValueOnce({
        ...alertInDatabase,
        isRead: true,
      } as any);

      const result = await controller.markAlertAsRead(id);

      expect(result).toEqual({
        success: true,
        message: 'Alerta marcada como leida',
        data: {
          ...alertInDatabase,
          isRead: true,
        },
      });
      expect(service.markAlertAsRead).toHaveBeenCalledWith(id);
    });
  });
});
