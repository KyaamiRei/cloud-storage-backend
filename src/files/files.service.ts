import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository, IsNull } from 'typeorm';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>
  ) {}

  findAll(userId: number, fileType?: FileType | string) {
    const qb = this.repository.createQueryBuilder('file');

    qb.where('file.userId = :userId', { userId });

    // Если тип не указан или равен "all", возвращаем только не удаленные файлы
    if (!fileType || fileType === 'all') {
      qb.andWhere('file.deletedAt IS NULL');
      return qb.getMany();
    }

    if (fileType === FileType.PHOTOS) {
      qb.andWhere('file.mimeType ILIKE :type', { type: '%image%' });
      qb.andWhere('file.deletedAt IS NULL');
    }

    if (fileType === FileType.TRASH) {
      qb.withDeleted().andWhere('file.deletedAt IS NOT NULL');
    }

    if (fileType === FileType.FAVORITES) {
      qb.andWhere('file.isFavorite = :isFavorite', { isFavorite: true });
      qb.andWhere('file.deletedAt IS NULL');
    }

    return qb.getMany();
  }

  create(file: Express.Multer.File, userId: string) {
    return this.repository.save({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      user: { id: Number(userId) },
    });
  }

  async remove(userId: string, ids: string) {
    const idsArray = ids.split(',').map(id => Number(id));
    const userIdNumber = Number(userId);

    const qb = this.repository.createQueryBuilder('file');

    qb.where('id IN (:...ids) AND userId = :userId', {
      ids: idsArray,
      userId: userIdNumber,
    });
    return qb.softDelete().execute();
  }

  async restore(userId: string, ids: string) {
    const idsArray = ids.split(',').map(id => Number(id));
    const userIdNumber = Number(userId);

    // Используем raw SQL для надежного обновления deletedAt
    const placeholders = idsArray.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      UPDATE files 
      SET "deletedAt" = NULL 
      WHERE id IN (${placeholders}) 
      AND "userId" = $${idsArray.length + 1} 
      AND "deletedAt" IS NOT NULL
    `;
    
    const parameters = [...idsArray, userIdNumber];
    const result = await this.repository.query(query, parameters);
    
    // Для PostgreSQL result - это массив с объектом, содержащим rowCount
    // Для других БД может быть другой формат
    const restored = result?.rowCount || result?.[0]?.rowCount || (Array.isArray(result) ? result.length : 0);

    return { restored };
  }

  async toggleFavorite(userId: number, fileId: number) {
    const file = await this.repository.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new BadRequestException('Файл не найден');
    }

    // Проверяем, не находится ли файл в корзине
    if (file.deletedAt) {
      throw new BadRequestException('Нельзя добавить файл из корзины в избранное');
    }

    file.isFavorite = !file.isFavorite;
    return this.repository.save(file);
  }

  async getFavorites(userId: number) {
    return this.repository.find({
      where: { userId, isFavorite: true, deletedAt: IsNull() },
    });
  }
}
