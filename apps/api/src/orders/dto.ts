import { Type } from 'class-transformer'
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { PATTERNS, PLANTS, SHAPES, TEXT_MAX } from './pricing'

const HEX = /^#[0-9a-fA-F]{6}$/
const PHONE = /^01[016789]-?\d{3,4}-?\d{4}$/

export class DesignDto {
  @IsIn(Object.keys(SHAPES)) shape: keyof typeof SHAPES
  @Matches(HEX) color: string
  @Matches(HEX) accent: string
  @IsIn(Object.keys(PATTERNS)) pattern: keyof typeof PATTERNS
  @IsString() @MaxLength(TEXT_MAX) text: string
  @Matches(HEX) textColor: string
  @IsIn(Object.keys(PLANTS)) plant: keyof typeof PLANTS
}

export class CreateOrderDto {
  @IsString() @MinLength(1) @MaxLength(20) name: string
  @Matches(PHONE, { message: '휴대폰 번호 형식이 아니에요' }) phone: string
  @ValidateNested() @Type(() => DesignDto) design: DesignDto
}

// 주문번호를 잊었을 때: 이름 + 휴대폰 번호로 찾기
export class LookupDto {
  @IsString() @MinLength(1) @MaxLength(20) name: string
  @Matches(PHONE, { message: '휴대폰 번호 형식이 아니에요' }) phone: string
}

// 관리자: 상태 변경
export class UpdateStatusDto {
  @IsIn(['RECEIVED', 'MAKING', 'SHIPPED', 'CANCELED']) status: 'RECEIVED' | 'MAKING' | 'SHIPPED' | 'CANCELED'
  @IsOptional() @IsString() @MaxLength(200) note?: string
}
